from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class WalletBase(BaseModel):
    name: str = Field(default="Ví chính", max_length=100, examples=["Ví chính", "Tài khoản tổng"])
    currency: str = Field(default="VND", max_length=10)


class WalletCreate(WalletBase):
    balance: Decimal = Field(default=Decimal("0.00"), ge=0, description="Số dư ban đầu")


class WalletUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)


class WalletResponse(WalletBase):
    id: int
    user_id: int
    balance: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)