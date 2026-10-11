import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.ai import AIReportResponse
from app.services.ai_service import analyze_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Financial Advisory"])


@router.post("/analyze-report", response_model=AIReportResponse)
@router.get("/analyze-report", response_model=AIReportResponse)
def analyze_financial_report(
    period: Literal["month", "year"] = Query(default="month"),
    month: int | None = Query(default=None, ge=1, le=12),
    year: int | None = Query(default=None, ge=1, le=9998),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return analyze_report(db, current_user.id, period, year, month)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Gemini financial report analysis failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Không thể phân tích báo cáo AI lúc này",
        ) from exc
