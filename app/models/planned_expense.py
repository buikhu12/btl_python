from sqlalchemy import Column, BigInteger, String, Numeric, Boolean, Date, SmallInteger, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class PlannedExpense(Base):
    __tablename__ = "planned_expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)  # Tiêu đề: "Tiền nhà tháng 10", "Bảo dưỡng xe"
    estimated_amount = Column(Numeric(15, 2), nullable=False)  # Số tiền dự tính chi
    actual_amount = Column(Numeric(15, 2), default=0.00, nullable=False)  # Số tiền thực tế đã chi
    
    is_recurring = Column(Boolean, default=False, nullable=False)  # Khoản chi cố định hàng tháng
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, COMPLETED, CANCELLED
    planned_date = Column(Date, nullable=True)  # Ngày dự kiến chi trong tháng
    
    month = Column(SmallInteger, nullable=False)
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Quan hệ
    user = relationship("User", back_populates="planned_expenses")
    category = relationship("Category", back_populates="planned_expenses")