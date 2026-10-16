from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PlannedExpenseBase(BaseModel):
    title: str = Field(..., max_length=255, examples=["Tiền nhà tháng 10", "Bảo dưỡng xe máy"])
    estimated_amount: Decimal = Field(..., gt=0, examples=[4500000])
    category_id: Optional[int] = Field(None, description="Danh mục chi tiêu (nếu có)")
    is_recurring: bool = Field(default=False, description="Đánh dấu khoản chi lặp lại hàng tháng")
    planned_date: Optional[date] = Field(None, description="Ngày dự kiến chi")
    month: int = Field(..., ge=1, le=12, examples=[10])
    year: int = Field(..., ge=2020, examples=[2026])


class PlannedExpenseCreate(PlannedExpenseBase):
    pass


class PlannedExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    estimated_amount: Optional[Decimal] = Field(None, gt=0)
    actual_amount: Optional[Decimal] = Field(None, ge=0)
    category_id: Optional[int] = None
    is_recurring: Optional[bool] = None
    status: Optional[str] = Field(None, description="PENDING, COMPLETED, CANCELLED")
    planned_date: Optional[date] = None


class PlannedExpenseResponse(PlannedExpenseBase):
    id: int
    user_id: int
    actual_amount: Decimal
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)