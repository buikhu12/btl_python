from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserCreate,UserResponse,UserUpdate
from app.services.user_service import UserService

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

@router.get("/",response_model=list[UserResponse])
def get_users(db:Session=Depends(get_db)):
    service=UserService(db)
    return service.get_all_users()

@router.get("/{user_id}",response_model=UserResponse)
def get_user(user_id:int,db:Session=Depends(get_db)):
    service=UserService(db)
    return service.get_user_by_id(user_id)

@router.put("/{user_id}")
def update_user(user_id:int, db:Session=Depends(get_db)):
    service = UserService(db)

    return service.delete_user(user_id)

@router.delete("/{user_id}")
def delete_user(user_id:int,db:Session=Depends(get_db)):
    service = UserService(db)

    return service.delete_user(user_id)