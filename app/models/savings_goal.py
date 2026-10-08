from datetime import datetime

from sqlalchemy import Column,DateTime,ForeignKey,Integer,Numeric,String ,Text
from sqlalchemy.orm import relationship

from app.core.database import Base

class SavingsGoal(Base):
    __tablename__="savings_goals"

    id=Column(Integer,primary_key=True,index=True)
    user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False,index=True)
    name=Column(String(100),nullable=False)
    target_amount=Column(Numeric(15,2),nullable=False,default=0)
    current_amount=Column(Numeric(15,2),nullable=False,default=0)
    deadline=Column(DateTime,nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column( DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User",back_populates="savings_goals")

    contributions = relationship(
    "SavingsContribution",
    back_populates="savings_goal",
    cascade="all, delete-orphan"
)