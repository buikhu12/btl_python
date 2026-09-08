from sqlalchemy.orm import Session

from app.models.category import Category


class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_many(self, user_id: int, category_type: str | None = None):
        query = self.db.query(Category).filter(Category.user_id == user_id)
        if category_type:
            query = query.filter(Category.type == category_type)
        return query.order_by(Category.type, Category.name).all()

    def get_by_id(self, category_id: int, user_id: int):
        return self.db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()

    def get_by_name_and_type(self, name: str, category_type: str, user_id: int):
        return self.db.query(Category).filter(
            Category.name == name, Category.type == category_type, Category.user_id == user_id
        ).first()

    def create(self, category: Category):
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def save(self, category: Category):
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete(self, category: Category):
        self.db.delete(category)
        self.db.commit()
