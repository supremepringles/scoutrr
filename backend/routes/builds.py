from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Response, status

from backend.repository import repository

router = APIRouter(prefix="/builds", tags=["builds"])


@router.get("")
def list_builds():
    return {"items": repository.list_builds()}


@router.post("")
def create_build(payload: dict[str, Any]):
    return repository.create_build(payload)


@router.delete("/{build_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_build(build_id: str) -> Response:
    try:
        repository.delete_build(build_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Build not found") from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
