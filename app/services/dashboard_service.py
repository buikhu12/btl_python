from app.repositories.dashboard_repository import DashboardRepository

class DashboardService:
    def __init__(self, db):
        self.repository = DashboardRepository(db)

    # Dashboard tổng quan
    def get_summary(self, user_id: int):
        total_income = self.repository.get_total_income(user_id) or 0
        total_expense = self.repository.get_total_expense(user_id) or 0
        transaction_count = self.repository.get_transaction_count(user_id) or 0
        balance = total_income - total_expense

        return {
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": balance,
            "transaction_count": transaction_count
        }

    # Chi tiêu theo category
    def get_category_expenses(self, user_id: int):
        data = self.repository.get_category_expenses(user_id)

        return [
            {
                "category_id": item.id,
                "category_name": item.name,
                "total_amount": item.total_amount
            }
            for item in data
        ]

    # Thu chi theo tháng
    def get_monthly_summary(self, user_id: int):
        data = self.repository.get_monthly_summary(user_id)

        return [
            {
                "year": int(item.year),
                "month": int(item.month),
                "type": item.type,
                "total_amount": item.total_amount
            }
            for item in data
        ] 

    # Các giao dịch gần đây
    def get_recent_transactions(self, user_id: int, limit: int = 5):
        data = self.repository.get_recent_transactions(user_id, limit)

        return [
            {
                "id": transaction.id,
                "amount": transaction.amount,
                "type": transaction.type,
                "note": transaction.note,
                "occurred_at": transaction.occurred_at,
                "category_name": category_name
            }
            for transaction, category_name in data
        ]

