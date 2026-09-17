import os
from datetime import datetime,timedelta,timezone

from app.models.user import User
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


import jwt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY=os.getenv("SECRET_KEY") #Getenv có nhiệm vụ đọc file
ALGORITHM="HS256" #thuật toán để kí jwt
ACCESS_TOKEN_EXPIRE_MINUTES = 60 #thời gian hết hạn token

oauth2_scheme = HTTPBearer()

def create_access_token(user_id: int):

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

