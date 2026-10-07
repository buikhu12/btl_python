from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id",ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), nullable=False, index=True)  # income | expense
    amount = Column(Numeric(15, 2), nullable=False)
    note = Column(Text, nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)   
   
    wallet = relationship(
        "Wallet", 
        back_populates="transactions"
    )
    user = relationship(
        "User", 
        back_populates="transactions"
    )
    category = relationship(
        "Category", 
        back_populates="transactions"
    )
    