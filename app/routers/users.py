from fastapi import APIRouter,Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserCreate,UserResponse,UserUpdate
from app.services.user_service import UserService
from app.dependencies.auth import get_current_user

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

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user=Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_current_user(data: UserUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return UserService(db).update_user(current_user.id, data)

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    UserService(db).delete_user(current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
