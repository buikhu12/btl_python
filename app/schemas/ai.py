from typing import Any

from pydantic import BaseModel


class AIReportResponse(BaseModel):
    """Response returned by the Gemini financial report endpoint."""

    report: dict[str, Any]
    analysis: str
