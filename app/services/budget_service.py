from decimal import Decimal
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.budget_repository import BudgetRepository
from app.repositories.wallet_repository import WalletRepository
from app.schemas.budget import BudgetCreate, BudgetProgressResponse, BudgetUpdate


class BudgetService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = BudgetRepository(db)
        self.wallet_repo = WalletRepository(db)

    def create_budget(self, dto: BudgetCreate, user_id: int) -> BudgetProgressResponse:
        """Thiết lập ngân sách trích logic cho 1 tháng."""
        # 1. Kiểm tra xem tháng này đã có ngân sách chưa
        existing = self.repo.get_by_period(user_id, dto.month, dto.year)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ngân sách cho tháng {dto.month}/{dto.year} đã tồn tại! Hãy dùng chức năng cập nhật."
            )

        # 2. Kiểm tra nghiệp vụ trích logic: Hạn mức không nên vượt quá số dư hiện có trong ví
        wallet = self.wallet_repo.get_by_user_id(user_id)
        current_wallet_balance = wallet.balance if wallet else Decimal("0.00")
        if dto.amount_limit > current_wallet_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Hạn mức ngân sách ({dto.amount_limit:,.0f} VND) không thể vượt quá "
                    f"tổng số tiền hiện có trong ví ({current_wallet_balance:,.0f} VND)!"
                )
            )

        # 3. Tạo ngân sách mới
        created_budget = self.repo.create(dto, user_id)

        # 4. Trả về tiến độ hiện tại (lúc mới tạo)
        return self.get_monthly_budget_progress(user_id, created_budget.month, created_budget.year)

    def update_budget(self, user_id: int, month: int, year: int, dto: BudgetUpdate) -> BudgetProgressResponse:
        """Cập nhật lại hạn mức ngân sách tháng."""
        budget = self.repo.get_by_period(user_id, month, year)
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chưa thiết lập ngân sách cho tháng {month}/{year}."
            )
        
        self.repo.update_limit(budget, dto.amount_limit)
        return self.get_monthly_budget_progress(user_id, month, year)

    def get_monthly_budget_progress(self, user_id: int, month: int, year: int) -> Optional[BudgetProgressResponse]:
        """
        Tính toán tiến độ chi tiêu so với ngân sách tháng:
        - total_spent: Tổng chi (EXPENSE) trong tháng
        - remaining_amount: amount_limit - total_spent
        - percentage_used: (total_spent / amount_limit) * 100%
        - status: NORMAL | YELLOW_WARNING (>=80%) | RED_OVERBUDGET (>=100%)
        """
        budget = self.repo.get_by_period(user_id, month, year)
        if not budget:
            return None

        # Tính tổng chi tiêu EXPENSE của user trong tháng đó
        total_spent_query = self.db.query(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == "EXPENSE",
            func.extract("month", Transaction.transaction_date) == month,
            func.extract("year", Transaction.transaction_date) == year
        ).scalar()

        total_spent = Decimal(str(total_spent_query))
        limit = budget.amount_limit
        remaining = limit - total_spent
        ratio = float((total_spent / limit) * 100) if limit > 0 else 0.0

        # Phân loại trạng thái cảnh báo tức thì
        status_flag = "NORMAL"
        if ratio >= 100.0:
            status_flag = "RED_OVERBUDGET"
        elif ratio >= 80.0:
            status_flag = "YELLOW_WARNING"

        return BudgetProgressResponse(
            id=budget.id,
            user_id=budget.user_id,
            amount_limit=limit,
            month=budget.month,
            year=budget.year,
            total_spent=total_spent,
            remaining_amount=remaining,
            percentage_used=round(ratio, 2),
            status=status_flag,
            created_at=budget.created_at
        )