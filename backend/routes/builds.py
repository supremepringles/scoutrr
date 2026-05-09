from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from backend.repository import repository

router = APIRouter(prefix="/builds", tags=["builds"])


@router.get("")
def list_builds():
    return {"items": repository.list_builds()}


@router.post("")
def create_build(payload: dict[str, Any]):
    return repository.create_build(payload)
