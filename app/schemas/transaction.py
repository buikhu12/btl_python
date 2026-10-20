from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TransactionBase(BaseModel):
    category_id: int | None = None
    type: Literal["income", "expense"]
    amount: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    note: str | None = Field(default=None, max_length=1000)
    occurred_at: datetime
    # Khóa idempotency_key chống trùng lặp giao dịch khi retry / mất kết nối
    idempotency_key: str | None = Field(default=None, max_length=100, description="Khóa idempotency duy nhất chống trùng lặp")


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    category_id: int | None = None
    type: Literal["income", "expense"] | None = None
    amount: Decimal | None = Field(default=None, gt=0, max_digits=15, decimal_places=2)
    note: str | None = Field(default=None, max_length=1000)
    occurred_at: datetime | None = None
    idempotency_key: str | None = Field(default=None, max_length=100)


class TransactionResponse(TransactionBase):
    id: int
    idempotency_key: str | None = None
    model_config = ConfigDict(from_attributes=True)


# Schema trả về cho API tra cứu trạng thái giao dịch theo idempotency_key kèm số dư ví hiện tại
class TransactionIdempotencyStatusResponse(BaseModel):
    transaction: TransactionResponse
    current_balance: Decimal
    is_duplicate: bool = True
    model_config = ConfigDict(from_attributes=True)
