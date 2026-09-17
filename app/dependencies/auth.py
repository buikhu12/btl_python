from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import ExpiredSignatureError, InvalidTokenError, decode
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.security.jwt import ALGORITHM, SECRET_KEY

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub", ""))
    except (ExpiredSignatureError, InvalidTokenError, TypeError, ValueError):
        raise credentials_error
    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise credentials_error
    return user

def require_admin(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "ADMIN":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user