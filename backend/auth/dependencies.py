from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from dotenv import load_dotenv
from datetime import datetime
import os

from backend.database import (
    users_collection,
    token_blacklist_collection
)

# --------------------------------------------------
# Load Environment Variables
# --------------------------------------------------
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

if not SECRET_KEY or not ALGORITHM:
    raise RuntimeError("SECRET_KEY and ALGORITHM must be set in environment variables")

# --------------------------------------------------
# OAuth2 Scheme
# --------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ==================================================
# GET CURRENT AUTHENTICATED USER
# ==================================================
def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validate JWT access token and return authenticated user
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # --------------------------------------------------
        # Check if token is blacklisted
        # --------------------------------------------------
        blacklisted = token_blacklist_collection.find_one({"token": token})
        if blacklisted:
            raise credentials_exception

        # --------------------------------------------------
        # Decode JWT
        # --------------------------------------------------
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        username: str = payload.get("sub")
        role: str = payload.get("role")
        token_type: str = payload.get("type")

        # Ensure it's an ACCESS token
        if username is None or role is None or token_type != "access":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # --------------------------------------------------
    # Verify user still exists in database
    # --------------------------------------------------
    user = users_collection.find_one({"username": username})

    if user is None:
        raise credentials_exception

    return {
        "username": username,
        "role": role
    }


# ==================================================
# ADMIN ROLE REQUIREMENT
# ==================================================
def require_admin(current_user: dict = Depends(get_current_user)):
    """
    Ensure user has admin privileges
    """

    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )

    return current_user
