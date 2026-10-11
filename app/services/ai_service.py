# app/services/ai_service.py

import json
import os
from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from dotenv import load_dotenv
from google import genai
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.category import Category

load_dotenv()


def analyze_report(db: Session, user_id: int):
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv(
        "GEMINI_MODEL",
        "gemini-flash-latest"
    )

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    # Lấy giao dịch của user hiện tại trong 6 tháng
    cutoff = datetime.utcnow() - timedelta(days=180)

    rows = (
        db.query(Transaction, Category.name.label("category_name"))
        .outerjoin(
            Category,
            Transaction.category_id == Category.id
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.occurred_at >= cutoff
        )
        .order_by(Transaction.occurred_at.asc())
        .limit(2000)
        .all()
    )

    total_income = Decimal("0")
    total_expense = Decimal("0")
    monthly = defaultdict(
        lambda: {
            "income": Decimal("0"),
            "expense": Decimal("0")
        }
    )
    categories = defaultdict(lambda: Decimal("0"))

    for transaction, category_name in rows:
        amount = Decimal(str(transaction.amount))
        transaction_type = transaction.type.lower()

        month = transaction.occurred_at.strftime("%Y-%m")

        if transaction_type == "income":
            total_income += amount
            monthly[month]["income"] += amount

        elif transaction_type == "expense":
            total_expense += amount
            monthly[month]["expense"] += amount

            categories[category_name or "Uncategorized"] += amount

    report = {
        "period": "Last 180 days",
        "transaction_count": len(rows),
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "balance": float(total_income - total_expense),
        "monthly": {
            month: {
                "income": float(values["income"]),
                "expense": float(values["expense"])
            }
            for month, values in sorted(monthly.items())
        },
        "expense_by_category": {
            name: float(amount)
            for name, amount in sorted(
                categories.items(),
                key=lambda item: item[1],
                reverse=True
            )
        }
    }

    if len(rows) == 0:
        return {
            "report": report,
            "analysis": (
                "📊 Báo cáo phân tích tài chính (180 ngày gần nhất)\n\n"
                "• Bạn hiện chưa có dữ liệu giao dịch nào trong 180 ngày qua.\n"
                "• Tổng thu nhập: 0 đ | Tổng chi tiêu: 0 đ | Số dư: 0 đ\n\n"
                "💡 Gợi ý hành động từ AI:\n"
                "1. Hãy bắt đầu ghi chép các giao dịch thu chi hàng ngày tại Lovely Money.\n"
                "2. Thiết lập ngân sách chi tiêu và phân bổ thu nhập theo quy tắc 50/30/20.\n"
                "3. Khi bạn ghi nhận các giao dịch thu chi, AI sẽ tự động phân tích chi tiết xu hướng và đưa ra lời khuyên tài chính tối ưu nhất cho bạn!"
            ),
        }

    prompt = f"""
Bạn là trợ lý phân tích tài chính cá nhân.

Hãy phân tích báo cáo tài chính dưới đây bằng tiếng Việt.

Dữ liệu báo cáo:
{json.dumps(report, ensure_ascii=False)}

Yêu cầu:
1. Tóm tắt thu nhập, chi tiêu và số dư.
2. Phân tích xu hướng thu nhập và chi tiêu theo tháng.
3. Chỉ ra các danh mục chi tiêu lớn nhất.
4. Nêu những dấu hiệu bất thường nếu dữ liệu thực sự cho thấy.
5. Đề xuất 3 hành động thực tế để cải thiện tài chính.
6. Không tự bịa số liệu hoặc suy đoán dữ liệu còn thiếu.
7. Nếu dữ liệu chưa đủ, hãy nói rõ giới hạn.
8. Đây là phân tích tham khảo, không phải lời khuyên đầu tư.

Đơn vị tiền tệ: VND.
"""

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=prompt
        )

        if response.text:
            return {
                "report": report,
                "analysis": response.text
            }
    except Exception as err:
        import logging
        logging.getLogger(__name__).warning("Gemini AI API unavailable (%s), using rule-based analysis.", err)

    # Phân tích dự phòng thông minh khi Gemini AI tạm thời bận hoặc quá tải
    top_cats = list(report["expense_by_category"].items())[:3]
    top_cats_str = ", ".join([f"{name}: {int(amount):,} đ" for name, amount in top_cats]) if top_cats else "Chưa có danh mục cụ thể"

    fallback_analysis = (
        f"📊 Phân tích sức khỏe tài chính (180 ngày gần nhất):\n\n"
        f"1. Tổng quan dòng tiền:\n"
        f"• Tổng thu nhập: {int(report['total_income']):,} đ\n"
        f"• Tổng chi tiêu: {int(report['total_expense']):,} đ\n"
        f"• Số dư ròng: {int(report['balance']):,} đ ({'Dương - tình hình tích cực' if report['balance'] >= 0 else 'Âm - chi vượt thu'})\n\n"
        f"2. Danh mục chi tiêu trọng điểm:\n"
        f"• Top danh mục chi nhiều nhất: {top_cats_str}\n\n"
        f"3. Khuyến nghị tài chính thiết thực:\n"
        f"• Áp dụng quy tắc 50/30/20: 50% chi tiêu thiết yếu, 30% sở thích cá nhân, 20% tích lũy.\n"
        f"• Đặt hạn mức chi tiêu cho các nhóm chi lớn để tránh bội chi ngoài dự kiến.\n"
        f"• Tiếp tục ghi chép đều đặn các khoản phát sinh để AI theo dõi biến động tài chính chính xác nhất.\n\n"
        f"*(Phân tích tham khảo hỗ trợ quản lý tài chính cá nhân)*"
    )

    return {
        "report": report,
        "analysis": fallback_analysis
    }