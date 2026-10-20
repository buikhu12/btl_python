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
        try:
            self._validate_category(data.category_id, data.type, user_id)
            from app.repositories.wallet_repository import WalletRepository

            wallet_repository = WalletRepository(self.repository.db)
            wallet = wallet_repository.get_by_user_id(user_id)
            if not wallet:
                wallet = wallet_repository.create_default_wallet(user_id=user_id)

            # Validate expenses against the current balance before changing it.
            if data.type == "expense" and data.amount > wallet.balance:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ngân sách không đủ",
                )

            tx = Transaction(user_id=user_id, wallet_id=wallet.id, **data.model_dump())
            created = self.repository.create(tx)

            # Apply the balance change once: income adds; expense subtracts.
            change = data.amount if data.type == "income" else -data.amount
            wallet.balance += change

            # Commit transaction row and wallet balance together.
            self.repository.db.commit()
            self.repository.db.refresh(created)
            return created
        except Exception:
            # Roll back pending database changes if validation or persistence fails.
            self.repository.db.rollback()
            raise

    def update_transaction(self, transaction_id: int, data: TransactionUpdate, user_id: int):
        try:
            transaction = self.get_transaction(transaction_id, user_id)
            updates = data.model_dump(exclude_unset=True)
            self._validate_category(
                updates.get("category_id", transaction.category_id),
                updates.get("type", transaction.type),
                user_id,
            )
            for field, value in updates.items():
                setattr(transaction, field, value)

            # Commit the update here so it can be rolled back on failure.
            self.repository.db.commit()
            self.repository.db.refresh(transaction)
            return transaction
        except Exception:
            # Roll back pending updates if validation or persistence fails.
            self.repository.db.rollback()
            raise

    def delete_transaction(self, transaction_id: int, user_id: int):
        try:
            tx = self.get_transaction(transaction_id, user_id)
            from app.repositories.wallet_repository import WalletRepository

            wallet = WalletRepository(self.repository.db).get_by_user_id(user_id)
            if wallet:
                change = tx.amount if tx.type == "expense" else -tx.amount
                wallet.balance += change

            self.repository.delete(tx)
            # Commit deletion and wallet balance change together.
            self.repository.db.commit()
        except Exception:
            # Restore the session if deleting or committing fails.
            self.repository.db.rollback()
            raise
