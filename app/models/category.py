from sqlalchemy import Column, ForeignKey, Integer, String

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(80), nullable=False)
    type = Column(String(20), nullable=False, index=True)  # income | expense
    icon = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)
