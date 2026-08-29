from pydantic import BaseModel,EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password:str

class TokenRespone(BaseModel):
    access_token:str
    token_type:str