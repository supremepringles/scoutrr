from __future__ import annotations

import base64
import json
import logging
import time
from datetime import datetime, timezone
from typing import List
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from backend.config import settings
from backend.models import Listing
from backend.search_config import CATEGORY_EXCLUSIONS, CONDITION_ID_MAP

log = logging.getLogger(__name__)


class EbayConfigError(RuntimeError):
    pass


class EbayApiError(RuntimeError):
    pass


class EbayClient:
    TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"
    SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"
    SCOPE = "https://api.ebay.com/oauth/api_scope"

    def __init__(self) -> None:
        self._access_token: str | None = None
        self._token_expires_at: float = 0

    def build_query(self, query: str, category: str | None = None, user_exclusions: str | None = None) -> str:
        negative_terms: list[str] = []
        negative_terms.extend(CATEGORY_EXCLUSIONS.get("Any", []))
        if category and category != "Any":
            negative_terms.extend(CATEGORY_EXCLUSIONS.get(category, []))
        if user_exclusions:
            negative_terms.extend(_split_exclusions(user_exclusions))

        seen: set[str] = set()
        deduped: list[str] = []
        for term in negative_terms:
            normalized = term.strip().lower()
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            deduped.append(term.strip())

        final_query = " ".join([query.strip(), *[f'-{term}' for term in deduped]]).strip()
        return final_query

    def search(self, query: str, category: str | None = None, user_exclusions: str | None = None, condition: str | None = None) -> List[Listing]:
        token = self._get_access_token()
        final_query = self.build_query(query, category=category, user_exclusions=user_exclusions)
        condition_id = CONDITION_ID_MAP.get(condition or "Any")
        log.info("Scoutrr eBay query: %s | condition=%s", final_query, condition_id or "any")
        params_dict = {"q": final_query, "limit": 25}
        if condition_id:
            params_dict["filter"] = f"conditionIds:{{{condition_id}}}"
        params = urlencode(params_dict)
        request = Request(f"{self.SEARCH_URL}?{params}")
        request.add_header("Authorization", f"Bearer {token}")
        request.add_header("Accept", "application/json")
        request.add_header("X-EBAY-C-MARKETPLACE-ID", settings.ebay_marketplace_id)

        try:
            with urlopen(request, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise EbayApiError(f"eBay Browse API search failed ({exc.code}): {detail}") from exc
        except URLError as exc:
            raise EbayApiError(f"eBay Browse API search failed: {exc.reason}") from exc

        items = payload.get("itemSummaries", [])
        listings: list[Listing] = []
        for item in items:
            listings.append(
                Listing(
                    id=item.get("itemId") or item.get("legacyItemId") or item.get("itemWebUrl", "unknown"),
                    title=item.get("title", "Untitled listing"),
                    price=_to_float(item.get("price", {}).get("value")),
                    shipping=_extract_shipping(item),
                    condition=item.get("condition", "Unknown"),
                    url=item.get("itemWebUrl", ""),
                    image_url=_extract_image(item),
                    listing_age_hours=_listing_age_hours(item.get("itemCreationDate")),
                )
            )
        return listings

    def _get_access_token(self) -> str:
        now = time.time()
        if self._access_token and now < self._token_expires_at - 60:
            return self._access_token

        client_id = settings.ebay_client_id or settings.ebay_app_id
        client_secret = settings.ebay_client_secret
        if not client_id or not client_secret:
            raise EbayConfigError(
                "Missing eBay credentials. Set EBAY_CLIENT_ID (or EBAY_APP_ID) and EBAY_CLIENT_SECRET in .env."
            )

        auth = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("ascii")
        body = urlencode({"grant_type": "client_credentials", "scope": self.SCOPE}).encode("utf-8")
        request = Request(self.TOKEN_URL, data=body, method="POST")
        request.add_header("Authorization", f"Basic {auth}")
        request.add_header("Content-Type", "application/x-www-form-urlencoded")
        request.add_header("Accept", "application/json")

        try:
            with urlopen(request, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise EbayApiError(f"eBay auth failed ({exc.code}): {detail}") from exc
        except URLError as exc:
            raise EbayApiError(f"eBay auth failed: {exc.reason}") from exc

        self._access_token = payload["access_token"]
        self._token_expires_at = now + int(payload.get("expires_in", 7200))
        return self._access_token


def _split_exclusions(value: str) -> list[str]:
    return [term.strip() for term in value.split(",") if term.strip()]


def _to_float(value: object) -> float:
    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return 0.0


def _extract_shipping(item: dict) -> float:
    shipping_options = item.get("shippingOptions") or []
    for option in shipping_options:
        cost = option.get("shippingCost") or {}
        if cost.get("value") is not None:
            return _to_float(cost.get("value"))
    return 0.0


def _extract_image(item: dict) -> str:
    primary = (item.get("image") or {}).get("imageUrl")
    if primary:
        return str(primary)
    for extra in item.get("additionalImages") or []:
        image_url = extra.get("imageUrl")
        if image_url:
            return str(image_url)
    return ""


def _listing_age_hours(value: str | None) -> int:
    if not value:
        return 0
    try:
        created = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return 0
    return max(0, int((datetime.now(timezone.utc) - created).total_seconds() // 3600))
