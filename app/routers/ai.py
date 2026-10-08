from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.ai import AIReportResponse
from app.services import analytics_service, ai_service

router = APIRouter(
    prefix="/ai",
    tags=["AI Financial Advisory"]
)

@router.get("/financial-analysis", response_model=AIReportResponse)
def analyze_finances(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_date = datetime.now()
    target_month = month if month else current_date.month
    target_year = year if year else current_date.year
    monthly_summary = analytics_service.generate_monthly_report(db, current_user.id, target_month, target_year)
    return ai_service.analyze_financial_data(monthly_summary)

