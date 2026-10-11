from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.planned_expense import (
    PlannedExpenseCreate,
    PlannedExpenseUpdate,
    PlannedExpenseResponse
)
from app.services.planned_expense_service import PlannedExpenseService

router = APIRouter(prefix="/planned-expenses", tags=["Planned Expenses"])


@router.post("/", response_model=PlannedExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_planned_expense(
    dto: PlannedExpenseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Thêm mục kế hoạch chi tiêu dự tính cho tháng.
    Hệ thống sẽ kiểm tra để đảm bảo tổng tiền dự tính không vượt quá Budget Limit của tháng.
    """
    service = PlannedExpenseService(db)
    return service.create_plan(dto=dto, user_id=current_user.id)


@router.get("/", response_model=List[PlannedExpenseResponse])
def get_planned_expenses(
    month: int = Query(..., ge=1, le=12, description="Tháng cần tra cứu"),
    year: int = Query(..., ge=2020, description="Năm cần tra cứu"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lấy toàn bộ danh sách kế hoạch chi tiêu dự tính trong một tháng."""
    service = PlannedExpenseService(db)
    return service.get_plans_by_period(user_id=current_user.id, month=month, year=year)


@router.patch("/{plan_id}", response_model=PlannedExpenseResponse)
def update_planned_expense(
    plan_id: int,
    dto: PlannedExpenseUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cập nhật thông tin hoặc trạng thái (PENDING / COMPLETED / CANCELLED) của mục kế hoạch."""
    service = PlannedExpenseService(db)
    return service.update_plan(plan_id=plan_id, dto=dto, user_id=current_user.id)


@router.delete("/{plan_id}", status_code=status.HTTP_200_OK)
def delete_planned_expense(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Xóa một mục kế hoạch chi tiêu."""
    service = PlannedExpenseService(db)
    return service.delete_plan(plan_id=plan_id, user_id=current_user.id)