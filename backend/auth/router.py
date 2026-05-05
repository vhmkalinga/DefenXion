from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta
from collections import defaultdict
from time import time
from pydantic import BaseModel
import os
import pyotp
from dotenv import load_dotenv

from backend.database import (
    users_collection,
    refresh_tokens_collection,
    token_blacklist_collection,
    app_settings_collection
)
from backend.auth.schemas import TokenResponse
from backend.auth.security import (
    verify_password,
    create_access_token,
    create_refresh_token
)
from backend.auth.dependencies import get_current_user


# ==================================================
# ENV SETUP
# ==================================================
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

if not SECRET_KEY or not ALGORITHM:
    raise RuntimeError("SECRET_KEY and ALGORITHM must be set in environment variables")


# ==================================================
# ROUTER INIT
# ==================================================
router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ==================================================
# SECURITY CONFIG
# ==================================================
MAX_FAILED_ATTEMPTS = 5
LOCK_DURATION_MINUTES = 15

RATE_LIMIT = 10
RATE_WINDOW = 60  # seconds

login_attempt_tracker = defaultdict(list)


# ==================================================
# LOGIN
# ==================================================
@router.post("/login")
def login_user(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    ip = request.client.host
    current_time = time()

    # ---------- RATE LIMIT ----------
    login_attempt_tracker[ip] = [
        t for t in login_attempt_tracker[ip]
        if current_time - t < RATE_WINDOW
    ]

    if len(login_attempt_tracker[ip]) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Try again later."
        )

    login_attempt_tracker[ip].append(current_time)

    # ---------- FIND USER ----------
    user = users_collection.find_one({"username": form_data.username})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # ---------- ACCOUNT LOCK CHECK ----------
    if user.get("account_locked"):
        lock_until = user.get("lock_until")

        if lock_until and lock_until > datetime.utcnow():
            raise HTTPException(
                status_code=403,
                detail="Account temporarily locked. Try again later."
            )
        else:
            users_collection.update_one(
                {"username": user["username"]},
                {"$set": {"account_locked": False, "failed_attempts": 0}}
            )

    # ---------- VERIFY PASSWORD ----------
    if not verify_password(form_data.password, user["hashed_password"]):

        failed_attempts = user.get("failed_attempts", 0) + 1
        update_data = {"failed_attempts": failed_attempts}

        if failed_attempts >= MAX_FAILED_ATTEMPTS:
            update_data.update({
                "account_locked": True,
                "lock_until": datetime.utcnow() + timedelta(minutes=LOCK_DURATION_MINUTES)
            })

        users_collection.update_one(
            {"username": user["username"]},
            {"$set": update_data}
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # ---------- RESET FAILED ATTEMPTS & LOG HISTORY ----------
    login_entry = {
        "ip": ip,
        "timestamp": datetime.utcnow()
    }
    users_collection.update_one(
        {"username": user["username"]},
        {
            "$set": {"failed_attempts": 0},
            "$push": {
                "login_history": {
                    "$each": [login_entry],
                    "$slice": -10  # Keep only the last 10 logins
                }
            }
        }
    )

    # ---------- 2FA CHECK ----------
    if user.get("two_factor_enabled"):
        temp_token = create_access_token({
            "sub": user["username"],
            "type": "2fa_temp"
        }, expires_delta=timedelta(minutes=5))
        return {
            "two_factor_required": True,
            "temp_token": temp_token
        }

    # ---------- GENERATE TOKENS ----------
    settings = app_settings_collection.find_one({"key": "app_settings"})
    timeout = settings.get("security", {}).get("session_timeout_minutes", 30) if settings else 30

    access_token = create_access_token({
        "sub": user["username"],
        "role": user["role"],
        "type": "access"
    }, expires_delta=timedelta(minutes=timeout))

    refresh_token = create_refresh_token(user["username"])

    refresh_tokens_collection.insert_one({
        "username": user["username"],
        "refresh_token": refresh_token,
        "created_at": datetime.utcnow()
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


# ==================================================
# LOGIN 2FA
# ==================================================
class Login2FARequest(BaseModel):
    temp_token: str
    otp_code: str

@router.post("/login/2fa")
def login_2fa(data: Login2FARequest):
    try:
        payload = jwt.decode(data.temp_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "2fa_temp":
            raise HTTPException(status_code=401, detail="Invalid token type")
        username = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired temporary token")

    user = users_collection.find_one({"username": username})
    if not user or not user.get("two_factor_enabled"):
        raise HTTPException(status_code=401, detail="2FA not enabled or user not found")

    totp = pyotp.TOTP(user["two_factor_secret"])
    if not totp.verify(data.otp_code, valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")

    # ---------- GENERATE TOKENS ----------
    settings = app_settings_collection.find_one({"key": "app_settings"})
    timeout = settings.get("security", {}).get("session_timeout_minutes", 30) if settings else 30

    access_token = create_access_token({
        "sub": user["username"],
        "role": user["role"],
        "type": "access"
    }, expires_delta=timedelta(minutes=timeout))

    refresh_token = create_refresh_token(user["username"])

    refresh_tokens_collection.insert_one({
        "username": user["username"],
        "refresh_token": refresh_token,
        "created_at": datetime.utcnow()
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


# ==================================================
# REFRESH TOKEN
# ==================================================
class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
def refresh_access_token(data: RefreshRequest):

    try:
        payload = jwt.decode(
            data.refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    stored = refresh_tokens_collection.find_one({
        "refresh_token": data.refresh_token
    })

    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token not recognized")

    username = payload.get("sub")

    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    settings = app_settings_collection.find_one({"key": "app_settings"})
    timeout = settings.get("security", {}).get("session_timeout_minutes", 30) if settings else 30

    new_access_token = create_access_token({
        "sub": username,
        "role": user["role"],
        "type": "access"
    }, expires_delta=timedelta(minutes=timeout))

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }


# ==================================================
# LOGOUT (TOKEN BLACKLIST)
# ==================================================
@router.post("/logout")
def logout(
    token: str = Depends(oauth2_scheme),
    current_user: dict = Depends(get_current_user)
):

    token_blacklist_collection.insert_one({
        "token": token,
        "username": current_user["username"],
        "blacklisted_at": datetime.utcnow()
    })

    refresh_tokens_collection.delete_many({
        "username": current_user["username"]
    })

    return {"message": "Logged out successfully"}


# ==================================================
# 2FA SETUP & VERIFY
# ==================================================
@router.post("/2fa/setup")
def setup_2fa(current_user: dict = Depends(get_current_user)):
    user = users_collection.find_one({"username": current_user["username"]})
    if user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")

    secret = pyotp.random_base32()
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user["email"], issuer_name="DefenXion")

    users_collection.update_one(
        {"username": current_user["username"]},
        {"$set": {"temp_2fa_secret": secret}}
    )

    return {"secret": secret, "uri": uri}


class VerifySetup2FARequest(BaseModel):
    otp_code: str

@router.post("/2fa/verify-setup")
def verify_setup_2fa(data: VerifySetup2FARequest, current_user: dict = Depends(get_current_user)):
    user = users_collection.find_one({"username": current_user["username"]})
    secret = user.get("temp_2fa_secret")

    if not secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")

    totp = pyotp.TOTP(secret)
    if not totp.verify(data.otp_code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")

    users_collection.update_one(
        {"username": current_user["username"]},
        {
            "$set": {"two_factor_enabled": True, "two_factor_secret": secret},
            "$unset": {"temp_2fa_secret": ""}
        }
    )

    return {"message": "2FA successfully enabled"}


class Disable2FARequest(BaseModel):
    password: str

@router.post("/2fa/disable")
def disable_2fa(data: Disable2FARequest, current_user: dict = Depends(get_current_user)):
    user = users_collection.find_one({"username": current_user["username"]})
    
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    if not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    users_collection.update_one(
        {"username": current_user["username"]},
        {
            "$set": {"two_factor_enabled": False},
            "$unset": {"two_factor_secret": "", "temp_2fa_secret": ""}
        }
    )

    return {"message": "2FA successfully disabled"}


# ==================================================
# CURRENT USER PROFILE
# ==================================================
@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    user = users_collection.find_one({"username": current_user["username"]}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "username": user.get("username"),
        "email": user.get("email"),
        "role": user.get("role"),
        "full_name": user.get("full_name", ""),
        "phone": user.get("phone", ""),
        "location": user.get("location", ""),
        "avatar": user.get("avatar", ""),
        "two_factor_enabled": user.get("two_factor_enabled", False),
        "login_history": user.get("login_history", []),
        "member_since": user.get("created_at", datetime.utcnow().strftime("%B %Y")) if isinstance(user.get("created_at"), str) else (user.get("created_at").strftime("%B %Y") if user.get("created_at") else datetime.utcnow().strftime("%B %Y"))
    }


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    avatar: str | None = None


@router.put("/me")
def update_me(data: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    update_data = {}
    if data.full_name is not None:
        update_data["full_name"] = data.full_name
    if data.email is not None:
        update_data["email"] = data.email
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.location is not None:
        update_data["location"] = data.location
    if data.avatar is not None:
        update_data["avatar"] = data.avatar

    if not update_data:
        return {"message": "No fields to update"}

    users_collection.update_one(
        {"username": current_user["username"]},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated successfully"}
