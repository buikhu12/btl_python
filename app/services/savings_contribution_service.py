from sqlalchemy.orm import Session

from app.models.savings_contribution import SavingsContribution
from app.repositories.savings_contribution_repository import (
    SavingsContributionRepository
)
from app.repositories.savings_goal_repository import SavingsGoalRepository


class SavingsContributionService:

    def __init__(self, db: Session):
        self.repository = SavingsContributionRepository(db)
        self.goal_repository = SavingsGoalRepository(db)

    def get_history(
        self,
        goal_id: int,
        user_id: int
    ):
        goal = self.goal_repository.get_by_id(
            goal_id,
            user_id
        )

        if goal is None:
            return None

        return self.repository.get_all_by_goal(goal_id)