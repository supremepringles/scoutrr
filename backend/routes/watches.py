from __future__ import annotations

import sqlite3
from typing import Any

from fastapi import APIRouter, HTTPException, Response, status

from backend.repository import repository

router = APIRouter(prefix="/watches", tags=["watches"])


@router.get("")
def list_watches():
    return {"items": repository.list_watches()}


@router.post("")
def create_watch(payload: dict[str, Any]):
    try:
        return repository.create_watch(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/{watch_id}")
def update_watch(watch_id: str, payload: dict[str, Any]):
    try:
        return repository.update_watch(watch_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Watch not found") from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{watch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_watch(watch_id: str) -> Response:
    try:
        repository.delete_watch(watch_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Watch not found") from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Listing must belong to the watch and still be active") from None
