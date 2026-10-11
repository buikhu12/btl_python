from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.planned_expense import PlannedExpense
from app.schemas.planned_expense import PlannedExpenseCreate, PlannedExpenseUpdate


class PlannedExpenseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, plan_id: int, user_id: int) -> Optional[PlannedExpense]:
        """Lấy 1 khoản kế hoạch theo ID (đảm bảo cô lập dữ liệu theo user_id)."""
        return self.db.query(PlannedExpense).filter(
            PlannedExpense.id == plan_id,
            PlannedExpense.user_id == user_id
        ).first()

    def get_all_by_period(self, user_id: int, month: int, year: int) -> List[PlannedExpense]:
        """Lấy tất cả các khoản kế hoạch dự tính trong một tháng của user."""
        return self.db.query(PlannedExpense).filter(
            PlannedExpense.user_id == user_id,
            PlannedExpense.month == month,
            PlannedExpense.year == year
        ).all()

    def get_total_estimated(self, user_id: int, month: int, year: int, exclude_plan_id: Optional[int] = None) -> Decimal:
        """Tính tổng số tiền dự tính của tất cả kế hoạch trong tháng."""
        query = self.db.query(func.coalesce(func.sum(PlannedExpense.estimated_amount), 0)).filter(
            PlannedExpense.user_id == user_id,
            PlannedExpense.month == month,
            PlannedExpense.year == year,
            PlannedExpense.status != "CANCELLED"  # Bỏ qua các khoản đã hủy
        )
        if exclude_plan_id:
            query = query.filter(PlannedExpense.id != exclude_plan_id)
        return Decimal(str(query.scalar()))

    def create(self, dto: PlannedExpenseCreate, user_id: int) -> PlannedExpense:
        """Tạo mới một mục kế hoạch chi tiêu."""
        plan = PlannedExpense(**dto.model_dump(), user_id=user_id)
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def update(self, plan: PlannedExpense, dto: PlannedExpenseUpdate) -> PlannedExpense:
        """Cập nhật thông tin kế hoạch chi tiêu."""
        update_data = dto.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(plan, key, value)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def delete(self, plan: PlannedExpense) -> None:
        """Xóa một khoản kế hoạch."""
        self.db.delete(plan)
        self.db.commit()