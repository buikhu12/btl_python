from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.category_repository import CategoryRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionService:
    def __init__(self, db: Session):
        self.repository = TransactionRepository(db)
        self.category_repository = CategoryRepository(db)

    def _validate_category(self, category_id: int | None, transaction_type: str, user_id: int):
        if category_id is None:
            return
        category = self.category_repository.get_by_id(category_id, user_id)
        if category is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Danh mục không tồn tại")
        if category.type != transaction_type:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Loại danh mục phải khớp với loại giao dịch")

    def get_transactions(self, user_id: int, skip: int, limit: int, category_id: int | None,
                         transaction_type: str | None, start_date: datetime | None, end_date: datetime | None):
        return self.repository.get_many(user_id, skip, limit, category_id, transaction_type, start_date, end_date)

    def get_transaction(self, transaction_id: int, user_id: int):
        transaction = self.repository.get_by_id(transaction_id, user_id)
        if transaction is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy giao dịch")
        return transaction

    def create_transaction(self, data: TransactionCreate, user_id: int):
        self._validate_category(data.category_id, data.type, user_id)
        return self.repository.create(Transaction(user_id=user_id, **data.model_dump()))

    def update_transaction(self, transaction_id: int, data: TransactionUpdate, user_id: int):
        transaction = self.get_transaction(transaction_id, user_id)
        updates = data.model_dump(exclude_unset=True)
        self._validate_category(updates.get("category_id", transaction.category_id), updates.get("type", transaction.type), user_id)
        for field, value in updates.items():
            setattr(transaction, field, value)
        return self.repository.save(transaction)

    def delete_transaction(self, transaction_id: int, user_id: int):
        self.repository.delete(self.get_transaction(transaction_id, user_id))
