from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.schemas.report import MonthlyFinancialSummary
from app.services import analytics_service

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

from app.dependencies.auth import get_current_user
from app.models.user import User

@router.get("/monthly", response_model=MonthlyFinancialSummary)
def get_monthly_report(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_date = datetime.now()
    target_month = month if month else current_date.month
    target_year = year if year else current_date.year
    
    return analytics_service.generate_monthly_report(db, current_user.id, target_month, target_year)