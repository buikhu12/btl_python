from sqlalchemy import Column, BigInteger, Numeric, Integer, SmallInteger, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_limit = Column(Numeric(15, 2), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Ràng buộc: Mỗi user chỉ có 1 ngân sách cho 1 tháng/năm
    __table_args__ = (
        UniqueConstraint("user_id", "month", "year", name="uq_user_category_budget_period"),
    )

    # Relationships
    user = relationship("User", back_populates="budgets")
