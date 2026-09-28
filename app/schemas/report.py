from pydantic import BaseModel
from typing import List

# Dùng để liệt kê các khoản chi tiêu tốn kém nhất
class CategoryExpense(BaseModel):
    category_id: int
    category_name: str
    amount: int

# Báo cáo tổng hợp cuối tháng
class MonthlyFinancialSummary(BaseModel):
    month: int
    year: int
    total_income: int
    total_expense: int
    net_savings: int
    savings_rate: float
    
    # Dữ liệu phân bổ theo quy tắc 50/30/20 (Thiết yếu / Sở thích / Tiết kiệm)
    needs_ratio: float
    wants_ratio: float
    savings_ratio: float
    
    top_expenses: List[CategoryExpense]