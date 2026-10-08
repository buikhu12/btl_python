from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class SavingsGoalCreate(BaseModel):
    name: str
    target_amount: Decimal
    deadline: datetime | None = None
    description: str | None = None


class SavingsGoalUpdate(BaseModel):
    name: str | None = None
    target_amount: Decimal | None = None
    deadline: datetime | None = None
    description: str | None = None


class SavingsAmountRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    note: str | None = None



class SavingsGoalResponse(BaseModel):
    id: int
    name: str
    target_amount: Decimal
    current_amount: Decimal
    remaining_amount: Decimal
    progress: Decimal
    deadline: datetime | None
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class SavingsContributionResponse(BaseModel):
    id: int
    savings_goal_id: int
    amount: Decimal
    type: str
    note: str | None
    created_at: datetime

    class Config:
        from_attributes = True