from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

# Bạn điều chỉnh lại import get_db và get_current_user cho đúng đường dẫn dependencies trong dự án
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.wallet import WalletResponse, WalletUpdate
from app.services.wallet_service import WalletService

router = APIRouter(prefix="/wallets", tags=["Wallets"])


@router.get("/me", response_model=WalletResponse)
def get_my_wallet(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lấy thông tin ví và số dư thực tế của người dùng hiện tại."""
    service = WalletService(db)
    return service.get_user_wallet(user_id=current_user.id)


@router.patch("/me", response_model=WalletResponse)
def update_my_wallet(
    dto: WalletUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cập nhật thông tin ví (đổi tên ví)."""
    service = WalletService(db)
    return service.update_wallet_info(user_id=current_user.id, dto=dto)