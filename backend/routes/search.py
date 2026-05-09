from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.repository import repository
from backend.scrapers.ebay import EbayApiError, EbayClient, EbayConfigError

router = APIRouter(prefix="/search", tags=["search"])
client = EbayClient()


@router.get("")
def search_listings(q: str = Query(..., min_length=2), category: str | None = Query(None), exclusions: str | None = Query(None)):
    try:
        listings = client.search(q, category=category, user_exclusions=exclusions)
    except EbayConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except EbayApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not listings:
        return {"query": q, "count": 0, "top_runner_id": None, "items": []}

    top_runner = min(listings, key=lambda item: item.total_cost)
    return {
        "query": q,
        "count": len(listings),
        "top_runner_id": top_runner.id,
        "items": [
            {
                "id": listing.id,
                "title": listing.title,
                "price": listing.price,
                "shipping": listing.shipping,
                "condition": listing.condition,
                "url": listing.url,
                "image_url": listing.image_url,
                "total_cost": listing.total_cost,
            }
            for listing in listings
        ],
    }


@router.post("/watches/{watch_id}/ingest")
def ingest_search_results(watch_id: str):
    try:
        watch = repository.get_watch(watch_id)
        listings = client.search(
            watch["query"],
            category=watch.get("category"),
            user_exclusions=watch.get("user_exclusions"),
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Watch not found") from None
    except EbayConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except EbayApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return repository.replace_watch_listings(
        watch_id,
        [
            {
                "id": listing.id,
                "title": listing.title,
                "price": listing.price,
                "shipping": listing.shipping,
                "condition": listing.condition,
                "source": listing.source,
                "listing_age_hours": listing.listing_age_hours,
                "url": listing.url,
                "image_url": listing.image_url,
            }
            for listing in listings
        ],
    )
