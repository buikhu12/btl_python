from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.savings_goal import SavingsGoal
from app.repositories.savings_goal_repository import SavingsGoalRepository
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoalUpdate
from app.models.savings_contribution import SavingsContribution

class SavingsGoalService:

    def __init__(self, db: Session):
        self.repository = SavingsGoalRepository(db)

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

        return self.repository.create(savings_goal)

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

        goal.current_amount += amount

        contribution = SavingsContribution(
            savings_goal_id=goal.id,
            amount=amount,
            type="DEPOSIT",
            note=note
        )

        self.repository.db.add(contribution)

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

        goal.current_amount -= amount

        contribution = SavingsContribution(
            savings_goal_id=goal.id,
            amount=amount,
            type="WITHDRAW",
            note=note
        )

        self.repository.db.add(contribution)

        goal = self.repository.update(goal)

        return self._format_goal(goal), None