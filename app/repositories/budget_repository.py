from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.schemas.budget import BudgetCreate


class BudgetRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_period(self, user_id: int, month: int, year: int) -> Optional[Budget]:
        """Tìm ngân sách tổng của user theo tháng và năm."""
        return self.db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == month,
            Budget.year == year
        ).first()

    def create(self, budget_data: BudgetCreate, user_id: int) -> Budget:
        """Lưu bản ghi ngân sách mới cho tháng."""
        budget = Budget(
            user_id=user_id,
            amount_limit=budget_data.amount_limit,
            month=budget_data.month,
            year=budget_data.year
        )
        self.db.add(budget)
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def update_limit(self, budget: Budget, new_limit: Decimal) -> Budget:
        """Cập nhật lại hạn mức ngân sách."""
        budget.amount_limit = new_limit
        self.db.commit()
        self.db.refresh(budget)
        return budget