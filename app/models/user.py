from sqlalchemy import Integer,String,Column
from app.core.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__="users"

    id=Column(Integer,primary_key=True,index=True)
    username=Column(String(50),unique=True,nullable=False)
    email=Column(String(100),unique=True,nullable=False)
    password_hash=Column(String(255),nullable=False)
    role = Column(String(20),nullable=False,default="USER")
    categories = relationship(
    "Category",
    back_populates="user"
    )

    transactions = relationship(
    "Transaction",
    back_populates="user"
    )