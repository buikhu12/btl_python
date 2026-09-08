from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(String(20), nullable=False, index=True)  # income | expense
    amount = Column(Numeric(15, 2), nullable=False)
    note = Column(Text, nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
