from sqlalchemy.orm import Session

from app.models.savings_contribution import SavingsContribution


class SavingsContributionRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, contribution: SavingsContribution):
        self.db.add(contribution)
        self.db.commit()
        self.db.refresh(contribution)

        return contribution

    def get_all_by_goal(
        self,
        savings_goal_id: int
    ):
        return (
            self.db.query(SavingsContribution)
            .filter(
                SavingsContribution.savings_goal_id == savings_goal_id
            )
            .order_by(
                SavingsContribution.created_at.desc()
            )
            .all()
        )

    def delete(self, contribution: SavingsContribution):
        self.db.delete(contribution)
        self.db.commit()