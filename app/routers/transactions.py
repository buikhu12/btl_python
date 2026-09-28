from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/", response_model=list[TransactionResponse])
def get_transactions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    category_id: int | None = None,
    type: Literal["income", "expense"] | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if start_date and end_date and start_date > end_date:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="start_date phải trước end_date")
    return TransactionService(db).get_transactions(
        current_user.id, skip, limit, category_id, type, start_date, end_date
    )


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return TransactionService(db).create_transaction(data, current_user.id)


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return TransactionService(db).get_transaction(transaction_id, current_user.id)


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: int, data: TransactionUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return TransactionService(db).update_transaction(transaction_id, data, current_user.id)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    TransactionService(db).delete_transaction(transaction_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
