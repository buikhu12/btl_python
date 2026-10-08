from typing import List

from sqlalchemy import Integer,String,Column
from sqlalchemy.orm import Mapped, relationship
from app.core.database import Base
from app.models.wallet import Wallet

class User(Base):
    __tablename__="users"

    id=Column(Integer,primary_key=True,index=True)
    username=Column(String(50),unique=True,nullable=False)
    email=Column(String(100),unique=True,nullable=False)
    password_hash=Column(String(255),nullable=False)
    role = Column(String(20),nullable=False,default="USER")
    
    wallet = relationship(
        "Wallet", 
        back_populates="user",
        uselist=False, 
        cascade="all, delete-orphan")
    
    budgets = relationship(
        "Budget", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    transactions = relationship(
        "Transaction", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    categories = relationship(
        "Category", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    savings_goals = relationship(
    "SavingsGoal",
    back_populates="user",
    cascade="all, delete-orphan",
)