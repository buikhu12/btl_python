from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime

# tổng quan tài chính
class DashboardSummary(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    transaction_count: int

# danh mục chi tiêu
class CategoryExpense(BaseModel):
    category_id: int
    category_name: str
    total_amount: Decimal

# báo cáo tổng kết
class MonthSumary(BaseModel):
    month: int
    year: int
    total_income: Decimal
    total_expense: Decimal

# giao dịch gần đây
class RecentTransaction(BaseModel):
    id: int
    amount: Decimal
    type: str
    note: str | None = None
    occurred_at: datetime
    category_name: str | None = None

