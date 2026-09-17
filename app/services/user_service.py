from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate,UserUpdate
from app.repositories.user_repository import UserRepository
from app.security.password import hash_password
class UserService:

    def __init__(self,db:Session):
        self.repository=UserRepository(db)

    def create_user(self,data : UserCreate):
        if self.repository.get_by_email(data.email) or self.repository.get_by_username(data.username):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email hoặc username đã tồn tại")
        user=User(
            username=data.username,
            email=data.email,
            password_hash=hash_password(data.password),
            role="USER"
        )

        return self.repository.create(user)

    def get_all_users(self):
        return self.repository.get_all()

    def get_user_by_id(self,user_id:int):
        return self.repository.get_by_id(user_id)

    def update_user(self,user_id:int,data:UserUpdate):
        user=self.repository.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")

        updates = data.model_dump(exclude_unset=True)
        if "email" in updates:
            other_user = self.repository.get_by_email(updates["email"])
            if other_user and other_user.id != user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email đã tồn tại")
            user.email = updates["email"]
        if "username" in updates:
            other_user = self.repository.get_by_username(updates["username"])
            if other_user and other_user.id != user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username đã tồn tại")
            user.username = updates["username"]
        if "password" in updates:
            user.password_hash = hash_password(updates["password"])

        return self.repository.update(user)

    def delete_user(self,user_id:int):
        user=self.repository.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
        self.repository.delete(user)

        return True
