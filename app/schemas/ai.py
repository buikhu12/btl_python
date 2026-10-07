from pydantic import BaseModel, Field
from typing import List

class AIReportResponse(BaseModel):
    financial_health_score: int = Field(ge=1, le=10, description="Điểm sức khỏe tài chính từ 1 đến 10")
    overall_assessment: str = Field(..., description="Đánh giá tổng quan 2-3 câu")
    wasteful_spending: List[str] = Field(..., description="Danh sách các khoản chi tiêu có dấu hiệu lãng phí")
    actionable_recommendations: List[str] = Field(..., description="3 đến 5 hành động cụ thể cần làm")
    is_mock: bool = False