<<<<<<< HEAD
from pydantic import BaseModel,EmailStr
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = None
=======
from pydantic import BaseModel, ConfigDict, EmailStr, Field
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
>>>>>>> main

class UserResponse(BaseModel):
    id:int
    username:str
    email:str

<<<<<<< HEAD
    class Config:
        from_attribute=True
=======
    model_config = ConfigDict(from_attributes=True)
>>>>>>> main
