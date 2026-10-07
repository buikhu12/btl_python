from fastapi import APIRouter,Depends, Response, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.database import get_db
from app.schemas.user import UserCreate,UserResponse,UserUpdate
from app.services.user_service import UserService
<<<<<<< HEAD
from app.dependencies.auth import get_current_user

=======
from app.security.jwt import get_current_user
from fastapi import APIRouter, Depends, HTTPException
>>>>>>> bb9db85fa2615284314d0904d39e08c10f6169ae
router=APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.post("/",response_model=UserResponse)
def create_user(data:UserCreate #dữ liệu từ client hay fontend
                ,db:Session=Depends(get_db) #database session
                ):
    service=UserService(db) #gọi service
    return service.create_user(data) #xử lý và trả về reponse
# user xem thông tin bản thân
@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user

<<<<<<< HEAD
@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user(data: UserUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return UserService(db).update_user(current_user.id, data)

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    UserService(db).delete_user(current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
=======

# user tự sửa thông tin cá nhân
@router.put("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Kiểm tra username
    if data.username is not None:
        existing_user = db.query(User).filter(
            User.username == data.username,
            User.id != current_user.id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username already exists"
            )

        current_user.username = data.username

    # Kiểm tra email
    if data.email is not None:
        existing_user = db.query(User).filter(
            User.email == data.email,
            User.id != current_user.id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        current_user.email = data.email

    db.commit()
    db.refresh(current_user)

    return current_user

@router.delete("/{user_id}")
def delete_user(user_id:int,db:Session=Depends(get_db)):
    service = UserService(db)

    return service.delete_user(user_id)
#truy cập cá nhân mỗi user
>>>>>>> bb9db85fa2615284314d0904d39e08c10f6169ae
