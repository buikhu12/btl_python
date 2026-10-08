from sqlalchemy.orm import Session

from app.models.savings_goal import SavingsGoal


class SavingsGoalRepository:

    def __init__(self, db: Session):
        self.db = db

    # CREATE
    def create(self, savings_goal: SavingsGoal):
        self.db.add(savings_goal)
        self.db.commit()
        self.db.refresh(savings_goal)

        return savings_goal

    # LIST - lấy tất cả hũ của một user
    def get_all_by_user(self, user_id: int):
        return (
            self.db.query(SavingsGoal)
            .filter(SavingsGoal.user_id == user_id)
            .order_by(SavingsGoal.created_at.desc())
            .all()
        )

    # GET - lấy một hũ theo ID
    def get_by_id(self, goal_id: int, user_id: int):
        return (
            self.db.query(SavingsGoal)
            .filter(
                SavingsGoal.id == goal_id,
                SavingsGoal.user_id == user_id
            )
            .first()
        )

    # UPDATE
    def update(self, savings_goal: SavingsGoal):
        self.db.commit()
        self.db.refresh(savings_goal)

        return savings_goal

    # DELETE
    def delete(self, savings_goal: SavingsGoal):
        self.db.delete(savings_goal)
        self.db.commit()