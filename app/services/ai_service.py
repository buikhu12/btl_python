# app/services/ai_service.py

import json
import logging
import os
from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from typing import Literal

from dotenv import load_dotenv
from google import genai
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.models.planned_expense import PlannedExpense

load_dotenv()
logger = logging.getLogger(__name__)


def analyze_report(
    db: Session,
    user_id: int,
    period: Literal["month", "year"] = "month",
    year: int | None = None,
    month: int | None = None,
):
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv(
        "GEMINI_MODEL",
        "gemini-flash-latest"
    )

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    selected_year = year or datetime.utcnow().year
    if period == "month":
        selected_month = month or datetime.utcnow().month
        if not 1 <= selected_month <= 12:
            raise RuntimeError("month must be between 1 and 12")
        start_date = datetime(selected_year, selected_month, 1)
        end_date = (
            datetime(selected_year + 1, 1, 1)
            if selected_month == 12
            else datetime(selected_year, selected_month + 1, 1)
        )
        period_label = f"Tháng {selected_month:02d}/{selected_year}"
    elif period == "year":
        selected_month = None
        start_date = datetime(selected_year, 1, 1)
        end_date = datetime(selected_year + 1, 1, 1)
        period_label = f"Năm {selected_year}"
    else:
        raise RuntimeError("period must be 'month' or 'year'")

    # 1. Thu thập dữ liệu Giao dịch thực tế (Transactions)
    rows = (
        db.query(Transaction, Category.name.label("category_name"))
        .outerjoin(
            Category,
            Transaction.category_id == Category.id
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.occurred_at >= start_date,
            Transaction.occurred_at < end_date,
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
        m_key = transaction.occurred_at.strftime("%Y-%m")

        if transaction_type == "income":
            total_income += amount
            monthly[m_key]["income"] += amount
        elif transaction_type == "expense":
            total_expense += amount
            monthly[m_key]["expense"] += amount
            categories[category_name or "Chưa phân loại"] += amount

    # 2. Thu thập dữ liệu Ngân sách (Budget)
    if period == "month":
        budget_row = (
            db.query(Budget)
            .filter(
                Budget.user_id == user_id,
                Budget.month == selected_month,
                Budget.year == selected_year,
            )
            .first()
        )
        budget_limit = float(budget_row.amount_limit) if budget_row else 0.0
        has_budget = budget_row is not None
        budget_label = f"Tháng {selected_month:02d}/{selected_year}"
    else:
        budget_rows = (
            db.query(Budget)
            .filter(
                Budget.user_id == user_id,
                Budget.year == selected_year,
            )
            .all()
        )
        budget_limit = sum(float(b.amount_limit) for b in budget_rows)
        has_budget = len(budget_rows) > 0
        budget_label = f"Năm {selected_year} ({len(budget_rows)} tháng đã đặt)"

    spent_val = float(total_expense)
    budget_remaining = max(0.0, budget_limit - spent_val) if budget_limit > 0 else 0.0
    budget_usage_pct = round((spent_val / budget_limit) * 100, 1) if budget_limit > 0 else 0.0

    if budget_limit > 0:
        if budget_usage_pct >= 100:
            budget_status = "OVER_BUDGET"
            budget_status_label = "Vượt trần ngân sách"
        elif budget_usage_pct >= 80:
            budget_status = "WARNING"
            budget_status_label = "Tiệm cận trần ngân sách"
        else:
            budget_status = "SAFE"
            budget_status_label = "Trong giới hạn an toàn"
    else:
        budget_status = "NOT_SET"
        budget_status_label = "Chưa thiết lập ngân sách"

    budget_info = {
        "has_budget": has_budget,
        "label": budget_label,
        "amount_limit": budget_limit,
        "total_spent": spent_val,
        "remaining": budget_remaining,
        "usage_percent": budget_usage_pct,
        "status": budget_status,
        "status_label": budget_status_label,
    }

    # 3. Thu thập dữ liệu Kế hoạch chi tiêu (Planned Expenses)
    plan_query = (
        db.query(PlannedExpense, Category.name.label("category_name"))
        .outerjoin(Category, PlannedExpense.category_id == Category.id)
        .filter(PlannedExpense.user_id == user_id, PlannedExpense.year == selected_year)
    )
    if period == "month":
        plan_query = plan_query.filter(PlannedExpense.month == selected_month)

    plan_rows = plan_query.order_by(PlannedExpense.created_at.desc()).all()

    total_plans_count = len(plan_rows)
    total_estimated = Decimal("0")
    completed_estimated = Decimal("0")
    pending_estimated = Decimal("0")
    completed_count = 0
    pending_count = 0
    cancelled_count = 0
    plans_list = []

    for plan, cat_name in plan_rows:
        est = Decimal(str(plan.estimated_amount or 0))
        act = Decimal(str(plan.actual_amount or 0))
        st = (plan.status or "PENDING").upper()

        if st != "CANCELLED":
            total_estimated += est

        if st == "COMPLETED":
            completed_count += 1
            completed_estimated += est
        elif st == "PENDING":
            pending_count += 1
            pending_estimated += est
        elif st == "CANCELLED":
            cancelled_count += 1

        plans_list.append({
            "title": plan.title,
            "category": cat_name or "Khác",
            "estimated_amount": float(est),
            "actual_amount": float(act),
            "status": st,
            "is_recurring": bool(plan.is_recurring),
            "planned_date": plan.planned_date.strftime("%d/%m/%Y") if plan.planned_date else None,
            "month": plan.month,
        })

    planned_info = {
        "total_plans": total_plans_count,
        "total_estimated": float(total_estimated),
        "completed_count": completed_count,
        "completed_estimated": float(completed_estimated),
        "pending_count": pending_count,
        "pending_estimated": float(pending_estimated),
        "cancelled_count": cancelled_count,
        "items": plans_list[:12],
    }

    # Tổng hợp báo cáo dữ liệu hoàn chỉnh
    report = {
        "period": period_label,
        "period_type": period,
        "selected_month": selected_month,
        "selected_year": selected_year,
        "transaction_count": len(rows),
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "balance": float(total_income - total_expense),
        "savings_rate": round(float((total_income - total_expense) / total_income * 100), 1) if total_income > 0 else 0.0,
        "monthly": {
            m: {
                "income": float(values["income"]),
                "expense": float(values["expense"])
            }
            for m, values in sorted(monthly.items())
        },
        "expense_by_category": {
            name: float(amount)
            for name, amount in sorted(
                categories.items(),
                key=lambda item: item[1],
                reverse=True
            )
        },
        "budget": budget_info,
        "planned_expenses": planned_info,
    }

    if len(rows) == 0 and not has_budget and total_plans_count == 0:
        return {
            "report": report,
            "analysis": (
                f"### ℹ️ Chưa có dữ liệu tài chính trong {period_label}\n\n"
                f"Hệ thống chưa ghi nhận giao dịch, ngân sách hoặc kế hoạch chi tiêu nào trong kỳ này.\n\n"
                f"👉 **Gợi ý bắt đầu:**\n"
                f"- Thêm giao dịch thu/chi hàng ngày\n"
                f"- Thiết lập hạn mức Ngân sách tháng\n"
                f"- Lập danh sách Kế hoạch chi tiêu dự kiến để AI phân tích và đưa ra lời khuyên tối ưu nhất!"
            ),
        }

    prompt = f"""
Bạn là chuyên gia cố vấn tài chính cá nhân thông minh và tận tâm.

Nhiệm vụ: Phân tích toàn diện tình hình tài chính cho {period_label} dựa trên 3 trụ cột dữ liệu:
1. Thu chi thực tế (Transactions)
2. Ngân sách định mức (Budget)
3. Kế hoạch chi tiêu dự kiến (Planned Expenses)

Dữ liệu hệ thống:
{json.dumps(report, ensure_ascii=False, indent=2)}

YÊU CẦU TRÌNH BÀY (BẮT BUỘC):
- Viết bằng tiếng Việt, phong cách chuyên nghiệp, tích cực, súc tích và mạch lạc.
- Sử dụng cấu trúc 5 phần rõ ràng với biểu tượng cảm xúc (emoji) như sau:
  📊 1. Tổng quan Dòng tiền & Tích lũy
  🎯 2. Kiểm soát Ngân sách (Budget)
  📅 3. Tiến độ Kế hoạch Chi tiêu (Planned Expenses)
  🏷️ 4. Phân tích Danh mục Chi tiêu Trọng điểm
  💡 5. Lộ trình Hành động & Tối ưu Tài chính

NỘI DUNG PHÂN TÍCH:
- Phần 1: Tóm tắt thu, chi, số dư ròng và tỷ lệ tiết kiệm.
- Phần 2: Đánh giá tỷ lệ sử dụng ngân sách ({budget_info['usage_percent']}% trên hạn mức {budget_info['amount_limit']:,.0f} đ). Cảnh báo nếu chi tiêu tiệm cận hoặc vượt trần ngân sách. Nếu chưa đặt ngân sách, hãy khuyến nghị đặt hạn mức.
- Phần 3: Phân tích kế hoạch chi tiêu ({planned_info['total_plans']} khoản, tổng dự tính {planned_info['total_estimated']:,.0f} đ). Nêu rõ số khoản đã chi ({planned_info['completed_count']}) và số khoản đang chờ ({planned_info['pending_count']}). Đánh giá xem các khoản chờ chi có thể làm vỡ ngân sách không.
- Phần 4: Nêu các danh mục chiếm tỷ trọng lớn và các dấu hiệu cần lưu ý.
- Phần 5: Đưa ra chính xác 3-4 lời khuyên hành động thực tế, cụ thể và khả thi.

Đơn vị tiền tệ: VND (viết kèm đ).
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
        logger.warning("Gemini AI API unavailable (%s), using rule-based analysis.", err)

    # Phân tích dự phòng thông minh khi Gemini AI tạm thời bận hoặc không kết nối được
    top_cats = list(report["expense_by_category"].items())[:3]
    top_cats_str = ", ".join([f"**{name}**: {int(amount):,} đ" for name, amount in top_cats]) if top_cats else "Chưa có danh mục cụ thể"

    # Đánh giá Ngân sách
    if budget_info["has_budget"]:
        b_limit_str = f"{int(budget_info['amount_limit']):,} đ"
        b_pct_str = f"{budget_info['usage_percent']}%"
        if budget_info["status"] == "OVER_BUDGET":
            budget_comment = f"⚠️ **Cảnh báo vượt trần**: Bạn đã chi **{int(spent_val):,} đ**, vượt **{int(spent_val - budget_info['amount_limit']):,} đ** so với hạn mức ngân sách ({b_limit_str}) - đạt tỷ lệ **{b_pct_str}**."
        elif budget_info["status"] == "WARNING":
            budget_comment = f"⚡ **Cảnh báo tiệm cận**: Bạn đã tiêu thụ **{b_pct_str}** ngân sách ({int(spent_val):,} đ / {b_limit_str}). Cần kiểm soát chặt chẽ các khoản chi không cấp thiết."
        else:
            budget_comment = f"✅ **Kiểm soát tốt**: Bạn mới sử dụng **{b_pct_str}** ngân sách ({int(spent_val):,} đ / {b_limit_str}). Còn khả dụng **{int(budget_info['remaining']):,} đ**."
    else:
        budget_comment = "💡 **Chưa đặt ngân sách**: Bạn chưa thiết lập ngân sách cho kỳ này. Nên cài đặt hạn mức chi tiêu để kiểm soát dòng tiền tốt hơn."

    # Đánh giá Kế hoạch chi tiêu
    if planned_info["total_plans"] > 0:
        plan_comment = (
            f"📋 Đã lập **{planned_info['total_plans']} khoản kế hoạch** với tổng dự tính **{int(planned_info['total_estimated']):,} đ**.\n"
            f"• **Đã thực hiện**: **{planned_info['completed_count']} mục** ({int(planned_info['completed_estimated']):,} đ)\n"
            f"• **Chờ chi**: **{planned_info['pending_count']} mục** ({int(planned_info['pending_estimated']):,} đ)"
        )
    else:
        plan_comment = "📝 Chưa có kế hoạch chi tiêu dự tính nào được tạo cho kỳ này. Hãy lập danh sách các khoản chi dự kiến để chủ động quản lý ngân sách."

    fallback_analysis = f"""### 📊 BÁO CÁO PHÂN TÍCH TÀI CHÍNH THÔNG MINH - {period_label}

#### 1. 💰 Tổng quan Dòng tiền & Tích lũy
• **Tổng thu nhập**: {int(report['total_income']):,} đ
• **Tổng chi tiêu**: {int(report['total_expense']):,} đ
• **Số dư ròng**: {int(report['balance']):,} đ ({'🟢 Dương - Tình hình tài chính tích cực' if report['balance'] >= 0 else '🔴 Âm - Chi tiêu vượt thu nhập'})
• **Tỷ lệ tiết kiệm**: **{report['savings_rate']}%**

#### 2. 🎯 Kiểm soát Ngân sách (Budget)
{budget_comment}

#### 3. 📅 Tiến độ Kế hoạch Chi tiêu (Planned Expenses)
{plan_comment}

#### 4. 🏷️ Danh mục Chi tiêu Trọng điểm
• **Top nhóm chi nhiều nhất**: {top_cats_str}

#### 5. 💡 Lộ trình Hành động & Tối ưu Tài chính
1. **Kiểm soát các khoản chi chờ thực hiện**: Đối chiếu các khoản chi chờ thực hiện ({planned_info['pending_count']} mục) với số dư ví hiện tại để tránh tình trạng thiếu hụt tiền mặt.
2. **Tuân thủ kỷ luật ngân sách**: Giữ tổng chi tiêu trong giới hạn an toàn dưới 80% hạn mức để luôn có quỹ dự phòng cho các tình huống khẩn cấp.
3. **Tối ưu hóa các khoản chi lớn**: Rà soát lại các nhóm chi tiêu chiếm tỷ trọng cao nhất ({top_cats[0][0] if top_cats else 'chi tiêu chính'}) để tìm kiếm cơ hội cắt giảm hợp lý.

*(Báo cáo phân tích hỗ trợ quản lý tài chính cá nhân thông minh)*"""

    return {
        "report": report,
        "analysis": fallback_analysis
    }
