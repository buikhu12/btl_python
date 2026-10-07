from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from app.models.wallet import Wallet
from app.schemas.wallet import WalletCreate


class WalletRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: int) -> Optional[Wallet]:
        """Lấy ví duy nhất của user (đảm bảo Data Isolation)."""
        return self.db.query(Wallet).filter(Wallet.user_id == user_id).first()

    def create_default_wallet(self, user_id: int, initial_balance: Decimal = Decimal("0.00"), name: str = "Ví chính") -> Wallet:
        """Tạo ví mặc định cho user mới."""
        wallet = Wallet(
            user_id=user_id,
            name=name,
            balance=initial_balance,
            currency="VND"
        )
        self.db.add(wallet)
        self.db.commit()
        self.db.refresh(wallet)
        return wallet

    def update_balance(self, user_id: int, amount_change: Decimal) -> Optional[Wallet]:
        """
        Cập nhật số dư ví:
        - Thu nhập (INCOME): amount_change > 0 (cộng tiền vào ví)
        - Chi tiêu (EXPENSE): amount_change < 0 (trừ tiền khỏi ví)
        """
        wallet = self.get_by_user_id(user_id)
        if not wallet:
            return None

        wallet.balance += amount_change
        self.db.commit()
        self.db.refresh(wallet)
        return wallet