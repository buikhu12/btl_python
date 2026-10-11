from decimal import Decimal
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.planned_expense_repository import PlannedExpenseRepository
from app.repositories.budget_repository import BudgetRepository
from app.schemas.planned_expense import (
    PlannedExpenseCreate,
    PlannedExpenseUpdate,
    PlannedExpenseResponse
)


class PlannedExpenseService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PlannedExpenseRepository(db)
        self.budget_repo = BudgetRepository(db)

    def create_plan(self, dto: PlannedExpenseCreate, user_id: int) -> PlannedExpenseResponse:
        """Thêm kế hoạch chi tiêu dự tính với kiểm tra trần Budget."""
        # 1. Kiểm tra xem user đã cài đặt Budget cho tháng này chưa
        budget = self.budget_repo.get_by_period(user_id, dto.month, dto.year)
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bạn chưa thiết lập Ngân sách (Budget) cho tháng {dto.month}/{dto.year}. Hãy tạo ngân sách trước!"
            )

        # 2. Tính tổng số tiền dự tính hiện tại + khoản mới định thêm
        current_total_estimated = self.repo.get_total_estimated(user_id, dto.month, dto.year)
        new_total_estimated = current_total_estimated + dto.estimated_amount

        # 3. Kiểm tra rào chắn logic: Tổng dự tính không được vượt quá Budget Limit của tháng
        if new_total_estimated > budget.amount_limit:
            available_plan_budget = budget.amount_limit - current_total_estimated
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Không thể thêm kế hoạch này! Tổng dự tính ({new_total_estimated:,.0f} VND) "
                    f"sẽ vượt quá Ngân sách tháng ({budget.amount_limit:,.0f} VND). "
                    f"Hạn mức dự tính còn lại có thể thêm: {available_plan_budget:,.0f} VND."
                )
            )

        # 4. Lưu kế hoạch mới
        created_plan = self.repo.create(dto, user_id)
        return PlannedExpenseResponse.model_validate(created_plan)

    def get_plans_by_period(self, user_id: int, month: int, year: int) -> List[PlannedExpenseResponse]:
        """Lấy danh sách kế hoạch dự tính trong tháng."""
        plans = self.repo.get_all_by_period(user_id, month, year)
        return [PlannedExpenseResponse.model_validate(p) for p in plans]

    def update_plan(self, plan_id: int, dto: PlannedExpenseUpdate, user_id: int) -> PlannedExpenseResponse:
        """Cập nhật khoản kế hoạch."""
        plan = self.repo.get_by_id(plan_id, user_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy mục kế hoạch chi tiêu này."
            )

        # Nếu có cập nhật số tiền dự tính, kiểm tra lại với Budget Limit
        if dto.estimated_amount is not None:
            budget = self.budget_repo.get_by_period(user_id, plan.month, plan.year)
            if budget:
                other_estimated = self.repo.get_total_estimated(
                    user_id, plan.month, plan.year, exclude_plan_id=plan_id
                )
                if (other_estimated + dto.estimated_amount) > budget.amount_limit:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Số tiền dự tính mới làm vượt quá tổng Ngân sách đã đặt cho tháng!"
                    )

        updated_plan = self.repo.update(plan, dto)
        return PlannedExpenseResponse.model_validate(updated_plan)

    def delete_plan(self, plan_id: int, user_id: int) -> dict:
        """Xóa một mục kế hoạch."""
        plan = self.repo.get_by_id(plan_id, user_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy mục kế hoạch chi tiêu này."
            )
        self.repo.delete(plan)
        return {"message": "Đã xóa mục kế hoạch chi tiêu thành công."}