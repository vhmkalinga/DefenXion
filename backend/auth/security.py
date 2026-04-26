import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

# --------------------------------------------------
# Load Environment Variables
# --------------------------------------------------
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

if not SECRET_KEY or not ALGORITHM:
    raise RuntimeError("SECRET_KEY and ALGORITHM must be set in environment variables")

# --------------------------------------------------
# Token Expiration Configuration
# --------------------------------------------------
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# --------------------------------------------------
# Password Hashing (bcrypt)
# --------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain password using bcrypt.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed one.
    """
    return pwd_context.verify(plain_password, hashed_password)


# --------------------------------------------------
# Access Token Creation
# --------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create short-lived JWT access token.
    """

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "type": "access"
    })

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


# --------------------------------------------------
# Refresh Token Creation
# --------------------------------------------------
def create_refresh_token(username: str) -> str:
    """
    Create long-lived JWT refresh token.
    Stored in DB for revocation control.
    """

    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": username,
        "exp": expire,
        "type": "refresh",
        "jti": secrets.token_hex(16)  # unique token identifier
    }

    encoded_refresh = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_refresh
