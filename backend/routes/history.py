from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from backend.repository import repository

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
def sold_history(q: str | None = Query(None, min_length=2), months: float = Query(3.0, ge=0.5, le=12.0)):
    return {"query": q, "months": months, "items": repository.list_sold_history(query=q, months=months)}


@router.post("")
def create_history_entry(payload: dict[str, Any]):
    return repository.create_sold_history(payload)
