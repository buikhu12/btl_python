from datetime import datetime

from sqlalchemy.orm import Session

from app.models.transaction import Transaction


class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_many(self, user_id: int, skip: int, limit: int, category_id: int | None, transaction_type: str | None,
                 start_date: datetime | None, end_date: datetime | None):
        query = self.db.query(Transaction).filter(Transaction.user_id == user_id)
        if category_id is not None:
            query = query.filter(Transaction.category_id == category_id)
        if transaction_type:
            query = query.filter(Transaction.type == transaction_type)
        if start_date:
            query = query.filter(Transaction.occurred_at >= start_date)
        if end_date:
            query = query.filter(Transaction.occurred_at <= end_date)
        return query.order_by(Transaction.occurred_at.desc(), Transaction.id.desc()).offset(skip).limit(limit).all()

    def get_by_id(self, transaction_id: int, user_id: int):
        return self.db.query(Transaction).filter(
            Transaction.id == transaction_id, Transaction.user_id == user_id
        ).first()

    def create(self, transaction: Transaction):
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def save(self, transaction: Transaction):
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def delete(self, transaction: Transaction):
        self.db.delete(transaction)
        self.db.commit()
