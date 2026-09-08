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


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    category_id: int | None = None
    type: Literal["income", "expense"] | None = None
    amount: Decimal | None = Field(default=None, gt=0, max_digits=15, decimal_places=2)
    note: str | None = Field(default=None, max_length=1000)
    occurred_at: datetime | None = None


class TransactionResponse(TransactionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
