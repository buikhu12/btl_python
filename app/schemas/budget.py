from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    amount_limit: Decimal = Field(..., gt=0, description="Hạn mức ngân sách quy định cho tháng", examples=[8000000])
    month: int = Field(..., ge=1, le=12, description="Tháng áp dụng (1 - 12)", examples=[10])
    year: int = Field(..., ge=2020, description="Năm áp dụng", examples=[2026])


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount_limit: Decimal = Field(..., gt=0, description="Điều chỉnh lại hạn mức ngân sách")


class BudgetProgressResponse(BudgetBase):
    id: int
    user_id: int
    total_spent: Decimal = Field(default=Decimal("0.00"), description="Tổng số tiền đã tiêu trong tháng")
    remaining_amount: Decimal = Field(default=Decimal("0.00"), description="Số tiền còn lại được phép tiêu")
    percentage_used: float = Field(default=0.0, description="Tỷ lệ % đã tiêu")
    status: str = Field(default="NORMAL", description="Trạng thái: NORMAL, YELLOW_WARNING (>=80%), RED_OVERBUDGET (>=100%)")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)