from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.savings_goal import (
    SavingsGoalCreate,
    SavingsGoalResponse,
    SavingsGoalUpdate,
    SavingsAmountRequest,
    SavingsContributionResponse
)
from app.services.savings_contribution_service import (
    SavingsContributionService
)
from app.dependencies.auth import get_current_user
from app.services.savings_goal_service import SavingsGoalService


router = APIRouter(
    prefix="/savings-goals",
    tags=["Savings Goals"]
)


# CREATE
@router.post("/", response_model=SavingsGoalResponse)
def create_savings_goal(
    data: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SavingsGoalService(db)

    return service.create_goal(
        current_user.id,
        data
    )


# LIST
@router.get("/", response_model=list[SavingsGoalResponse])
def get_savings_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SavingsGoalService(db)

    return service.get_all_goals(
        current_user.id
    )


# GET DETAIL
@router.get("/{goal_id}", response_model=SavingsGoalResponse)
def get_savings_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SavingsGoalService(db)

    goal = service.get_goal(
        goal_id,
        current_user.id
    )

    if goal is None:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    return goal


# UPDATE
@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_savings_goal(
    goal_id: int,
    data: SavingsGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SavingsGoalService(db)

    goal = service.update_goal(
        goal_id,
        current_user.id,
        data
    )

    if goal is None:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    return goal


# DELETE
@router.delete("/{goal_id}")
def delete_savings_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SavingsGoalService(db)

    deleted = service.delete_goal(
        goal_id,
        current_user.id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    return {
        "message": "Savings goal deleted successfully"
    }

#nạp tiền
@router.post(
    "/{goal_id}/deposit",
    response_model=SavingsGoalResponse
)
def deposit_money(
    goal_id: int,
    data: SavingsAmountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SavingsGoalService(db)

    goal, error = service.add_money(
    goal_id,
    current_user.id,
    data.amount,
    data.note
)

    if error:
        raise HTTPException(
            status_code=404,
            detail=error
        )

    return goal

#rút tiền
@router.post(
    "/{goal_id}/withdraw",
    response_model=SavingsGoalResponse
)
def withdraw_money(
    goal_id: int,
    data: SavingsAmountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SavingsGoalService(db)

    goal, error = service.withdraw_money(
    goal_id,
    current_user.id,
    data.amount,
    data.note
)

    if error == "Savings goal not found":
        raise HTTPException(
            status_code=404,
            detail=error
        )

    if error == "Insufficient savings balance":
        raise HTTPException(
            status_code=400,
            detail=error
        )

    return goal

@router.get(
    "/{goal_id}/history",
    response_model=list[SavingsContributionResponse]
)
def get_savings_history(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = SavingsContributionService(db)

    history = service.get_history(
        goal_id,
        current_user.id
    )

    if history is None:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    return history