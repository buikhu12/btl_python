import json
from app.schemas.ai import AIReportResponse
from app.schemas.report import MonthlyFinancialSummary
from app.clients import ai_client

def analyze_financial_data(summary: MonthlyFinancialSummary) -> AIReportResponse:
    try:
        data_str = summary.model_dump_json()
        
        prompt = f"""
        Bạn là một chuyên gia tài chính cá nhân. Dựa vào báo cáo thu chi sau:
        {data_str}
        
        Hãy phân tích và trả về CHỈ MỘT chuỗi JSON hợp lệ với cấu trúc chính xác như sau, không kèm bất kỳ giải thích nào khác:
        {{
            "financial_health_score": <số nguyên từ 1 đến 10>,
            "overall_assessment": "<Đánh giá tổng quan ngắn gọn trong 2 câu>",
            "wasteful_spending": ["<khoản lãng phí 1>", "<khoản lãng phí 2>"],
            "actionable_recommendations": ["<hành động 1>", "<hành động 2>", "<hành động 3>"]
        }}
        """
        
        raw_text = ai_client.get_gemini_response(prompt)
        
        clean_text = raw_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:-3]
            
        parsed_data = json.loads(clean_text)
        return AIReportResponse(**parsed_data, is_mock=False)
        
    except Exception as e:
        print(f"Lỗi: {e}")
        return AIReportResponse(
            financial_health_score=5,
            overall_assessment="Dữ liệu phân tích mẫu do hệ thống AI đang bảo trì.",
            wasteful_spending=["Mua sắm chưa có kế hoạch (MOCK)"],
            actionable_recommendations=["Theo dõi lại hạn mức ăn uống", "Gửi tiết kiệm"],
            is_mock=True
        )