from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
def alert_status():
    return {
        "provider": "discord-webhook",
        "enabled": False,
        "note": "Wire DISCORD_WEBHOOK_URL in .env to enable passive alert delivery.",
    }
