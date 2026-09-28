from typing import Literal

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    type: Literal["income", "expense"] | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return CategoryService(db).get_categories(current_user.id, type)


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(data: CategoryCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return CategoryService(db).create_category(data, current_user.id)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return CategoryService(db).get_category(category_id, current_user.id)


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, data: CategoryUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return CategoryService(db).update_category(category_id, data, current_user.id)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    CategoryService(db).delete_category(category_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
