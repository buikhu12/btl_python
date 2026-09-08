from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate,AdminResetPassword
from app.security.jwt import require_admin
from app.security.password import hash_password


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# Admin lấy tất cả người dùng
@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(User).all()


# Admin lấy thông tin 1 người dùng
@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# Admin tự sửa thông tin bản thân
@router.put("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if data.username is not None:
        current_admin.username = data.username

    if data.email is not None:
        existing_user = db.query(User).filter(
            User.email == data.email,
            User.id != current_admin.id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        current_admin.email = data.email

    db.commit()
    db.refresh(current_admin)

    return current_admin


# Admin sửa thông tin user
@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if data.username is not None:
        existing_user = db.query(User).filter(
            User.username == data.username,
            User.id != user_id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username already exists"
            )

        user.username = data.username

    if data.email is not None:
        existing_user = db.query(User).filter(
            User.email == data.email,
            User.id != user_id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        user.email = data.email

    db.commit()
    db.refresh(user)

    return user

# admin reset password để lấy lại mật khẩu khi user mất 
@router.put("/users/{user_id}/password")
def reset_password(
    user_id: int,
    data: AdminResetPassword,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.password_hash = hash_password(data.new_password)

    db.commit()

    return {
        "message": "Password reset successfully"
    }