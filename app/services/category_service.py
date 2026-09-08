from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    def __init__(self, db: Session):
        self.repository = CategoryRepository(db)

    def get_categories(self, user_id: int, category_type: str | None = None):
        return self.repository.get_many(user_id, category_type)

    def get_category(self, category_id: int, user_id: int):
        category = self.repository.get_by_id(category_id, user_id)
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy danh mục")
        return category

    def create_category(self, data: CategoryCreate, user_id: int):
        name = data.name.strip()
        if self.repository.get_by_name_and_type(name, data.type, user_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Danh mục này đã tồn tại")
        values = data.model_dump(exclude_none=True)
        values["name"] = name
        return self.repository.create(Category(user_id=user_id, **values))

    def update_category(self, category_id: int, data: CategoryUpdate, user_id: int):
        category = self.get_category(category_id, user_id)
        updates = data.model_dump(exclude_unset=True)
        if "name" in updates:
            updates["name"] = updates["name"].strip()
        name = updates.get("name", category.name)
        category_type = updates.get("type", category.type)
        duplicate = self.repository.get_by_name_and_type(name, category_type, user_id)
        if duplicate and duplicate.id != category.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Danh mục này đã tồn tại")
        for field, value in updates.items():
            setattr(category, field, value)
        return self.repository.save(category)

    def delete_category(self, category_id: int, user_id: int):
        self.repository.delete(self.get_category(category_id, user_id))
