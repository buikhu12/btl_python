from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.wallet_repository import WalletRepository
from app.schemas.wallet import WalletResponse, WalletUpdate


class WalletService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = WalletRepository(db)

    def get_user_wallet(self, user_id: int) -> WalletResponse:
        """Lấy ví của user, nếu chưa có (ví dụ tài khoản cũ) thì tự khởi tạo."""
        wallet = self.repo.get_by_user_id(user_id)
        if not wallet:
            wallet = self.repo.create_default_wallet(user_id=user_id)
        return WalletResponse.model_validate(wallet)

    def update_wallet_info(self, user_id: int, dto: WalletUpdate) -> WalletResponse:
        """Cập nhật tên ví."""
        wallet = self.repo.get_by_user_id(user_id)
        if not wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy ví của người dùng."
            )
        if dto.name is not None:
            wallet.name = dto.name
            self.db.commit()
            self.db.refresh(wallet)
        return WalletResponse.model_validate(wallet)

    def adjust_balance(self, user_id: int, amount: Decimal, is_income: bool) -> WalletResponse:
        """
        Hàm dùng nội bộ khi ghi nhận giao dịch:
        - Thu nhập (Income): is_income=True -> cộng tiền ví
        - Chi tiêu (Expense): is_income=False -> trừ tiền ví
        """
        change = amount if is_income else -amount
        wallet = self.repo.get_by_user_id(user_id)
        if not wallet:
            wallet = self.repo.create_default_wallet(user_id=user_id)

        # Kiểm tra nếu chi tiêu vượt quá số dư thực tế trong ví
        if not is_income and wallet.balance < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Số dư trong ví không đủ để thực hiện chi tiêu (Hiện có: {wallet.balance:,.0f} VND)."
            )

        updated_wallet = self.repo.update_balance(user_id=user_id, amount_change=change)
        return WalletResponse.model_validate(updated_wallet)