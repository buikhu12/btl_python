from pydantic import BaseModel,EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password:str

class LoginUser(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    
class TokenRespone(BaseModel):
    access_token:str
    token_type:str