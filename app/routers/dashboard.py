from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import (DashboardSummary, CategoryExpense, RecentTransaction)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/summary", response_model=DashboardSummary)
def get_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = DashboardService(db)
    return service.get_summary(current_user.id)

@router.get("/category-expenses", response_model=list[CategoryExpense])
def get_category_expenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = DashboardService(db)
    return service.get_category_expenses(current_user.id)

@router.get("/monthly")
def get_monthly_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_monthly_summary(current_user.id)

@router.get("/recent-transactions", response_model=list[RecentTransaction])
def get_recent_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_recent_transactions(current_user.id)

