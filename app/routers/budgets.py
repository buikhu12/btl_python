from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.budget import BudgetCreate, BudgetProgressResponse, BudgetUpdate
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post("/", response_model=BudgetProgressResponse, status_code=status.HTTP_201_CREATED)
def create_monthly_budget(
    dto: BudgetCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Thiết lập hạn mức ngân sách trích cho một tháng cụ thể."""
    service = BudgetService(db)
    return service.create_budget(dto=dto, user_id=current_user.id)


@router.get("/progress", response_model=Optional[BudgetProgressResponse])
def get_monthly_budget_progress(
    month: int = Query(..., ge=1, le=12, description="Tháng cần kiểm tra"),
    year: int = Query(..., ge=2020, description="Năm cần kiểm tra"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Lấy tiến độ chi tiêu theo ngân sách tháng:
    - Tổng đã tiêu (total_spent)
    - Còn lại (remaining_amount)
    - Tỷ lệ % (percentage_used)
    - Trạng thái cảnh báo: NORMAL, YELLOW_WARNING (>=80%), RED_OVERBUDGET (>=100%)
    """
    service = BudgetService(db)
    return service.get_monthly_budget_progress(user_id=current_user.id, month=month, year=year)


@router.patch("/", response_model=BudgetProgressResponse)
def update_monthly_budget(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    dto: BudgetUpdate = ...,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Điều chỉnh hạn mức ngân sách tháng đã thiết lập."""
    service = BudgetService(db)
    return service.update_budget(user_id=current_user.id, month=month, year=year, dto=dto)