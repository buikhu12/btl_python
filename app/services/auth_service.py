from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest
from app.security.password import verify_password
from app.security.jwt import create_access_token


class AuthService:

    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def login(self, data: LoginRequest):
        user = self.repository.get_by_email(data.email)

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Email hoặc mật khẩu không chính xác"
            )

        if not verify_password(
            data.password,
            user.password_hash
        ):
            raise HTTPException(
                status_code=401,
                detail="Email hoặc mật khẩu không chính xác"
            )

        token = create_access_token(user.id)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }