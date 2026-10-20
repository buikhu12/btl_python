from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.category_repository import CategoryRepository
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.wallet_repository import WalletRepository
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = TransactionRepository(db)
        self.category_repository = CategoryRepository(db)
        self.wallet_repository = WalletRepository(db)

    def _validate_category(self, category_id: int | None, transaction_type: str, user_id: int):
        if category_id is None:
            return
        category = self.category_repository.get_by_id(category_id, user_id)
        if category is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Danh mục không tồn tại",
            )
        if category.type != transaction_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Loại danh mục phải khớp với loại giao dịch",
            )

    def get_transactions(
        self,
        user_id: int,
        skip: int,
        limit: int,
        category_id: int | None,
        transaction_type: str | None,
        start_date: datetime | None,
        end_date: datetime | None,
    ):
        return self.repository.get_many(
            user_id, skip, limit, category_id, transaction_type, start_date, end_date
        )

    def get_transaction(self, transaction_id: int, user_id: int):
        transaction = self.repository.get_by_id(transaction_id, user_id)
        if transaction is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy giao dịch",
            )
        return transaction

    def create_transaction(self, data: TransactionCreate, user_id: int):
        try:
            # 1. Kiểm tra idempotency_key: Nếu key đã tồn tại trước đó, trả lại giao dịch cũ
            # Tuyệt đối KHÔNG cộng/trừ ví lần nữa để bảo đảm tính idempotent khi client retry
            idempotency_key = getattr(data, "idempotency_key", None)
            if idempotency_key:
                existing_tx = self.repository.get_by_idempotency_key(idempotency_key, user_id)
                if existing_tx:
                    return existing_tx

            # 2. Kiểm tra tính hợp lệ của danh mục
            self._validate_category(data.category_id, data.type, user_id)

            # 3. Lấy ví của user (nếu chưa có thì tạo ví mặc định)
            wallet = self.wallet_repository.get_by_user_id(user_id)
            if not wallet:
                wallet = self.wallet_repository.create_default_wallet(user_id=user_id)

            # 4. Kiểm tra số dư ví đối với giao dịch chi tiêu (expense)
            if data.type == "expense" and data.amount > wallet.balance:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ngân sách không đủ",
                )

            # 5. Cập nhật số dư ví DUY NHẤT 1 LẦN (income cộng thêm, expense trừ đi)
            delta = data.amount if data.type == "income" else -data.amount
            wallet.balance += delta

            # 6. Tạo đối tượng Transaction mới
            tx_data = data.model_dump()
            tx = Transaction(user_id=user_id, wallet_id=wallet.id, **tx_data)
            created = self.repository.create(tx)

            # 7. Commit cả giao dịch và số dư ví trong cùng một transaction DB
            self.db.commit()
            self.db.refresh(created)
            return created

        except IntegrityError:
            # Xử lý trường hợp va chạm concurrency khi cùng 1 key gửi tới song song
            self.db.rollback()
            idempotency_key = getattr(data, "idempotency_key", None)
            if idempotency_key:
                existing_tx = self.repository.get_by_idempotency_key(idempotency_key, user_id)
                if existing_tx:
                    return existing_tx
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Giao dịch trùng lặp",
            )
        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise

    def update_transaction(self, transaction_id: int, data: TransactionUpdate, user_id: int):
        try:
            transaction = self.get_transaction(transaction_id, user_id)
            updates = data.model_dump(exclude_unset=True)

            new_category_id = updates.get("category_id", transaction.category_id)
            new_type = updates.get("type", transaction.type)
            new_amount = updates.get("amount", transaction.amount)

            self._validate_category(new_category_id, new_type, user_id)

            # Đồng bộ lại số dư ví nếu có thay đổi số tiền hoặc loại giao dịch
            wallet = self.wallet_repository.get_by_user_id(user_id)
            if wallet:
                # Hoàn tác tác động của giao dịch cũ
                old_effect = transaction.amount if transaction.type == "income" else -transaction.amount
                # Tính tác động của giao dịch mới
                new_effect = new_amount if new_type == "income" else -new_amount
                
                updated_balance = wallet.balance - old_effect + new_effect
                if updated_balance < 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Ngân sách không đủ để cập nhật giao dịch này",
                    )
                wallet.balance = updated_balance

            for field, value in updates.items():
                setattr(transaction, field, value)

            saved = self.repository.save(transaction)
            self.db.commit()
            self.db.refresh(saved)
            return saved

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise

    def delete_transaction(self, transaction_id: int, user_id: int):
        try:
            tx = self.get_transaction(transaction_id, user_id)
            wallet = self.wallet_repository.get_by_user_id(user_id)

            if wallet:
                # Hoàn lại tiền nếu xóa khoản chi, trừ lại tiền nếu xóa khoản thu
                change = tx.amount if tx.type == "expense" else -tx.amount
                if wallet.balance + change < 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Số dư ví không đủ để xóa khoản thu nhập này",
                    )
                wallet.balance += change

            self.repository.delete(tx)
            self.db.commit()
            return {"detail": "Xóa giao dịch thành công"}

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise