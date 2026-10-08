from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.report import MonthlyFinancialSummary, CategoryExpense

def generate_monthly_report(db: Session, user_id: int, month: int, year: int) -> MonthlyFinancialSummary:
    # 1. Lọc giao dịch trong tháng
    base_query = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        extract('month', Transaction.occurred_at) == month,
        extract('year', Transaction.occurred_at) == year
    )

    # 2. Tính tổng thu và tổng chi
    income = base_query.filter(Transaction.type == "income").with_entities(func.coalesce(func.sum(Transaction.amount), 0)).scalar()
    expense = base_query.filter(Transaction.type == "expense").with_entities(func.coalesce(func.sum(Transaction.amount), 0)).scalar()

    # 3. Tính toán các chỉ số cơ bản
    net_savings = income - expense
    savings_rate = round((net_savings / income * 100), 2) if income > 0 else 0.0

    # 4. Tìm Top 3 danh mục tiêu tốn nhiều tiền nhất
    top_expenses_query = (
        db.query(Category.id, Category.name, func.sum(Transaction.amount).label("total"))
        .join(Transaction, Category.id == Transaction.category_id)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            extract('month', Transaction.occurred_at) == month,
            extract('year', Transaction.occurred_at) == year
        )
        .group_by(Category.id, Category.name)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(3)
        .all()
    )

    top_expenses = [
        CategoryExpense(category_id=row.id, category_name=row.name, amount=row.total) 
        for row in top_expenses_query
    ]

    needs_ratio = 50.0 if income > 0 else 0.0
    wants_ratio = 30.0 if income > 0 else 0.0
    actual_savings_ratio = savings_rate

    return MonthlyFinancialSummary(
        month=month,
        year=year,
        total_income=income,
        total_expense=expense,
        net_savings=net_savings,
        savings_rate=savings_rate,
        needs_ratio=needs_ratio,
        wants_ratio=wants_ratio,
        savings_ratio=actual_savings_ratio,
        top_expenses=top_expenses
    )