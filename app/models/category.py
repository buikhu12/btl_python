from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # nullable=True nếu muốn hỗ trợ danh mục hệ thống tạo sẵn
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(80), nullable=False)
    type = Column(String(20), nullable=False, index=True)  # income | expense
    icon = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)

    # Chống trùng tên danh mục cho cùng 1 user
    __table_args__ = (
        UniqueConstraint("user_id", "name", "type", name="uq_user_category_name_type"),
    )

    # Relationships
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")