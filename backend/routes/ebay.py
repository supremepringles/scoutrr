from __future__ import annotations

import hashlib
import json
import logging

from fastapi import APIRouter, HTTPException, Query, Request, Response, status
from fastapi.responses import JSONResponse

from backend.config import settings

router = APIRouter(prefix="/ebay", tags=["ebay"])
log = logging.getLogger("scoutrr")


@router.get("/deletion-notification", status_code=status.HTTP_200_OK)
async def deletion_notification_challenge(
    request: Request,
    challenge_code: str = Query(..., min_length=1),
) -> JSONResponse:
    if not settings.ebay_deletion_token:
        raise HTTPException(status_code=500, detail="EBAY_DELETION_TOKEN is not configured")
    if not settings.ebay_deletion_endpoint_url:
        raise HTTPException(status_code=500, detail="EBAY_DELETION_ENDPOINT_URL is not configured")

    endpoint_url = settings.ebay_deletion_endpoint_url
    digest = hashlib.sha256()
    digest.update(challenge_code.encode("utf-8"))
    digest.update(settings.ebay_deletion_token.encode("utf-8"))
    digest.update(endpoint_url.encode("utf-8"))
    challenge_response = digest.hexdigest()

    log.info(
        "Handled eBay deletion challenge: challenge_code=%s endpoint_url=%s",
        challenge_code,
        endpoint_url,
    )
    return JSONResponse(status_code=status.HTTP_200_OK, content={"challengeResponse": challenge_response})


@router.post("/deletion-notification", status_code=status.HTTP_200_OK)
async def deletion_notification(request: Request) -> Response:
    raw_body = await request.body()
    content_type = request.headers.get("content-type", "")

    payload: object
    if "json" in content_type.lower():
        try:
            payload = json.loads(raw_body.decode("utf-8") or "{}")
        except (UnicodeDecodeError, json.JSONDecodeError):
            payload = raw_body.decode("utf-8", errors="replace")
    else:
        payload = raw_body.decode("utf-8", errors="replace")

    log.info(
        "Received eBay deletion notification: headers=%s payload=%s",
        dict(request.headers),
        payload,
    )
    return Response(status_code=status.HTTP_200_OK)
