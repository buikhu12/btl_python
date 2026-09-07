from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate,UserUpdate
from app.repositories.user_repository import UserRepository
from app.security.password import hash_password
class UserService:

    def __init__(self,db:Session):
        self.repository=UserRepository(db)

    def create_user(self,data : UserCreate):
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
            return "User not found"

        user.username=data.username
        user.email=data.email
        user.password_hash=hash_password(data.password)

        return self.repository.update(user)

    def delete_user(self,user_id:int):
        user=self.repository.get_by_id(user_id)
        if user is None:
            return "User not found"
        self.repository.delete(user)

        return True