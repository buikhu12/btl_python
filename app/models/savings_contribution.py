from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class SavingsContribution(Base):
    __tablename__ = "savings_contributions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    savings_goal_id = Column(
        Integer,
        ForeignKey("savings_goals.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    amount = Column(
        Numeric(15, 2),
        nullable=False
    )

    type = Column(
        String(20),
        nullable=False,
        index=True
    )

    note = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    savings_goal = relationship(
        "SavingsGoal",
        back_populates="contributions"
    )