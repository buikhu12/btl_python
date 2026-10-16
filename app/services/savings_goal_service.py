from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.savings_goal import SavingsGoal
from app.repositories.savings_goal_repository import SavingsGoalRepository
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoalUpdate
from app.models.savings_contribution import SavingsContribution
from app.models.wallet import Wallet
from app.repositories.wallet_repository import WalletRepository
from app.models.transaction import Transaction
from app.models.category import Category
from app.repositories.category_repository import CategoryRepository

class SavingsGoalService:

    def __init__(self, db: Session):
        self.repository = SavingsGoalRepository(db)
        self.wallet_repository = WalletRepository(db)

    # CREATE
    def create_goal(self, user_id: int, data: SavingsGoalCreate):

        savings_goal = SavingsGoal(
            user_id=user_id,
            name=data.name,
            target_amount=data.target_amount,
            current_amount=Decimal("0"),
            deadline=data.deadline,
            description=data.description
        )

        saved_goal = self.repository.create(savings_goal)
        return self._format_goal(saved_goal)

    # LIST
    def get_all_goals(self, user_id: int):

        goals = self.repository.get_all_by_user(user_id)

        return [
            self._format_goal(goal)
            for goal in goals
        ]

    # GET DETAIL
    def get_goal(self, goal_id: int, user_id: int):

        goal = self.repository.get_by_id(
            goal_id,
            user_id
        )

        if goal is None:
            return None

        return self._format_goal(goal)

    # UPDATE
    def update_goal(
        self,
        goal_id: int,
        user_id: int,
        data: SavingsGoalUpdate
    ):

        goal = self.repository.get_by_id(
            goal_id,
            user_id
        )

        if goal is None:
            return None

        if data.name is not None:
            goal.name = data.name

        if data.target_amount is not None:
            goal.target_amount = data.target_amount

        if data.deadline is not None:
            goal.deadline = data.deadline

        if data.description is not None:
            goal.description = data.description

        goal = self.repository.update(goal)

        return self._format_goal(goal)

    # DELETE
    def delete_goal(self, goal_id: int, user_id: int):

        goal = self.repository.get_by_id(
            goal_id,
            user_id
        )

        if goal is None:
            return False

        self.repository.delete(goal)

        return True

    # FORMAT RESPONSE
    def _format_goal(self, goal: SavingsGoal):

        target = Decimal(goal.target_amount)
        current = Decimal(goal.current_amount)

        remaining = max(
            target - current,
            Decimal("0")
        )

        if target > 0:
            progress = (current / target) * Decimal("100")
        else:
            progress = Decimal("0")

        return {
            "id": goal.id,
            "name": goal.name,
            "target_amount": target,
            "current_amount": current,
            "remaining_amount": remaining,
            "progress": round(progress, 2),
            "deadline": goal.deadline,
            "description": goal.description,
            "created_at": goal.created_at
        }

    def add_money(
        self,
        goal_id: int,
        user_id: int,
        amount: Decimal,
        note: str | None = None
    ):
        goal = self.repository.get_by_id(
            goal_id,
            user_id
        )
        
        if goal is None:
            return None, "Savings goal not found"

        # Tiền nạp vào hũ phải có sẵn trong ví; không cho phép ví bị âm.
        wallet = self.wallet_repository.get_by_user_id(user_id)
        if wallet is None or wallet.balance < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Ngân sách không đủ'
            )

        # Cập nhật ví, số dư hũ và lịch sử trong cùng session/commit.
        wallet.balance -= amount
        goal.current_amount += amount

        contribution = SavingsContribution(
            savings_goal_id=goal.id,
            amount=amount,
            type="DEPOSIT",
            note=note
        )
        self.repository.db.add(contribution)

        # Tạo giao dịch chi tiêu tương ứng để tính vào số giao dịch và lịch sử ví
        category_repo = CategoryRepository(self.repository.db)
        existing_cats = category_repo.get_many(user_id, "expense")
        saving_cat = next((c for c in existing_cats if c.name.strip().lower() == "tiết kiệm"), None)
        if saving_cat is None:
            saving_cat = Category(
                user_id=user_id,
                name="Tiết kiệm",
                type="expense",
                color="#10b981",
                icon="PiggyBank"
            )
            self.repository.db.add(saving_cat)
            self.repository.db.flush()

        tx_note = f"Tiết kiệm: {goal.name}"
        if note and note.strip():
            tx_note = f"{tx_note} - {note.strip()}"

        transaction = Transaction(
            user_id=user_id,
            wallet_id=wallet.id,
            category_id=saving_cat.id if saving_cat else None,
            type="expense",
            amount=amount,
            note=tx_note,
            occurred_at=datetime.now(timezone.utc)
        )
        self.repository.db.add(transaction)

        goal = self.repository.update(goal)

        return self._format_goal(goal), None


    def withdraw_money(
        self,
        goal_id: int,
        user_id: int,
        amount: Decimal,
        note: str | None = None
    ):
        goal = self.repository.get_by_id(
            goal_id,
            user_id
        )

        if goal is None:
            return None, "Savings goal not found"

        if amount > goal.current_amount:
            return None, "Insufficient savings balance"

        # Tiền rút khỏi hũ được hoàn về ví; nếu user chưa có ví thì tạo ví trong cùng transaction.
        wallet = self.wallet_repository.get_by_user_id(user_id)
        if wallet is None:
            wallet = Wallet(
                user_id=user_id,
                name="Ví chính",
                balance=Decimal("0.00"),
                currency="VND",
            )
            self.repository.db.add(wallet)
            self.repository.db.flush()

        wallet.balance += amount
        goal.current_amount -= amount

        contribution = SavingsContribution(
            savings_goal_id=goal.id,
            amount=amount,
            type="WITHDRAW",
            note=note
        )
        self.repository.db.add(contribution)

        # Tạo giao dịch thu nhập tương ứng khi hoàn tiền về ví
        category_repo = CategoryRepository(self.repository.db)
        existing_income_cats = category_repo.get_many(user_id, "income")
        saving_income_cat = next((c for c in existing_income_cats if c.name.strip().lower() == "tiết kiệm"), None)
        if saving_income_cat is None:
            saving_income_cat = Category(
                user_id=user_id,
                name="Tiết kiệm",
                type="income",
                color="#10b981",
                icon="PiggyBank"
            )
            self.repository.db.add(saving_income_cat)
            self.repository.db.flush()

        tx_note = f"Rút tiết kiệm: {goal.name}"
        if note and note.strip():
            tx_note = f"{tx_note} - {note.strip()}"

        transaction = Transaction(
            user_id=user_id,
            wallet_id=wallet.id,
            category_id=saving_income_cat.id if saving_income_cat else None,
            type="income",
            amount=amount,
            note=tx_note,
            occurred_at=datetime.now(timezone.utc)
        )
        self.repository.db.add(transaction)

        goal = self.repository.update(goal)

        return self._format_goal(goal), None
