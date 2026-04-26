from pydantic import BaseModel
from typing import Optional




class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserInDB(BaseModel):
    username: str
    email: Optional[str]
    hashed_password: str
    role: str
