from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import LoginRequest,TokenRespone
from app.services.auth_service import AuthService

router=APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/login",response_model=TokenRespone)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service=AuthService(db)
    return service.login(data)
