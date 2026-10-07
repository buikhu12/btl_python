from pydantic import BaseModel, ConfigDict, EmailStr, Field
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
<<<<<<< HEAD
    password: str | None = Field(default=None, min_length=8, max_length=128)
=======
>>>>>>> bb9db85fa2615284314d0904d39e08c10f6169ae

class UserResponse(BaseModel):
    id:int
    username:str
    email:str
    role: str
<<<<<<< HEAD

    model_config = ConfigDict(from_attributes=True)
=======
    class Config:
        from_attribute=True
>>>>>>> bb9db85fa2615284314d0904d39e08c10f6169ae

class AdminResetPassword(BaseModel):
    new_password: str