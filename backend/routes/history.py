from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query, Response, status

from backend.repository import repository

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
def sold_history(
    q: str | None = Query(None, min_length=2),
    months: float | None = Query(None, ge=0.25, le=12.0),
    platform: str | None = Query(None),
    condition: str | None = Query(None),
):
    return {
        "query": q,
        "months": months,
        "platform": platform,
        "condition": condition,
        "items": repository.list_sold_history(query=q, months=months, platform=platform, condition=condition),
    }


@router.post("")
def create_history_entry(payload: dict[str, Any]):
    return repository.create_sold_history(payload)


@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_entry(history_id: str) -> Response:
    try:
        repository.delete_sold_history(history_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="History entry not found") from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
