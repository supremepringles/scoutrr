from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from backend.repository import repository

router = APIRouter(prefix="/watches", tags=["watches"])


@router.get("")
def list_watches():
    return {"items": repository.list_watches()}


@router.post("")
def create_watch(payload: dict[str, Any]):
    return repository.create_watch(payload)


@router.post("/{watch_id}/listings")
def create_listing(watch_id: str, payload: dict[str, Any]):
    try:
        return repository.create_listing(watch_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Watch not found") from None


@router.post("/{watch_id}/veto")
def set_watch_veto(watch_id: str, payload: dict[str, Any]):
    try:
        return repository.set_watch_veto(watch_id, payload.get("listing_id"))
    except KeyError:
        raise HTTPException(status_code=404, detail="Watch not found") from None
