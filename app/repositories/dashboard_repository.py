from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.transaction import Transaction
from app.models.category import Category

class DashboardRepository:
    def __init__(self,db: Session):
        self.db=db

    #tổng thu
    def get_total_income(self,user_id:int):
        return self.db.query(func.coalesce(
            func.sum(Transaction.amount),0
        )).filter(Transaction.user_id==user_id,Transaction.type=="income").scalar()

    #tổng chi
    def get_total_expense(self,user_id:int):
         return self.db.query(func.coalesce(
                    func.sum(Transaction.amount),0
                )).filter(Transaction.user_id==user_id,Transaction.type=="expense").scalar()

    #đếm số giao dịch
    def get_transaction_count(self,user_id:int):
        return self.db.query(func.count(Transaction.id)).filter(Transaction.user_id==user_id).scalar()

    #chi tiêu theo category
    def get_category_expenses(self,user_id:int):

        #kết nối 2 bảng , lọc dữ liệu ,gom,rồi cộng
        return self.db.query(Category.id,Category.name,func.sum(
            Transaction.amount).label("total_amount")).join(
                Transaction,
                Transaction.category_id==Category.id
            ).filter(
                Transaction.user_id==user_id,
                Transaction.type=="expense"
            ).group_by(
                Category.id,
                Category.name
            ).all()

    #tổng thu/chi theo tháng
    def get_monthly_summary(self,user_id:int):


        #lọc theo id,gom nhóm theo năm và tháng,lấy dữ liệu theo năm và tháng rồi sum,sắp xếp theo thời gian
        return self.db.query(
            extract(
                "year",
                Transaction.occurred_at
            ).label("year"),
            extract(
                "month",
                Transaction.occurred_at
            ).label("month"),
            Transaction.type,

            func.sum(Transaction.amount).label("total_amount")
        ).filter(
            Transaction.user_id==user_id
        ).group_by(
            extract("year",Transaction.occurred_at),
            extract("month",Transaction.occurred_at),
            Transaction.type
        ).order_by(
            extract("year",Transaction.occurred_at),
            extract("month",Transaction.occurred_at)
        ).all()

    #các giao dịch gần đây
    def get_recent_transactions(self,user_id:int,limit:int=5):

        #left join,lọc giao dịch theo người dùng ,sắp xếp giao dịch theo date,lấy ra 5 cái
        return self.db.query(
            Transaction,
            Category.name.label("category_name")
        ).outerjoin(
            Category,
            Transaction.category_id==Category.id
        ).filter(
            Transaction.user_id==user_id
        ).order_by(
            Transaction.occurred_at.desc()
        ).limit(limit).all()
        
    