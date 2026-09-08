from pydantic import BaseModel,EmailStr
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None

class UserResponse(BaseModel):
    id:int
    username:str
    email:str
    role: str
    class Config:
        from_attribute=True

class AdminResetPassword(BaseModel):
    new_password: str