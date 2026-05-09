from __future__ import annotations

import logging
from datetime import datetime, timezone
from threading import Event, Thread
from time import sleep

from backend.repository import repository
from backend.scrapers.ebay import EbayApiError, EbayClient, EbayConfigError

log = logging.getLogger(__name__)


class WatchPoller:
    def __init__(self, tick_seconds: int = 60):
        self.tick_seconds = tick_seconds
        self._stop = Event()
        self._thread: Thread | None = None
        self._client = EbayClient()

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = Thread(target=self._run, daemon=True, name="scoutrr-watch-poller")
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2)

    def _run(self) -> None:
        while not self._stop.is_set():
            self._poll_due_watches()
            sleep(self.tick_seconds)

    def _poll_due_watches(self) -> None:
        now = datetime.now(timezone.utc)
        for watch in repository.list_pollable_watches():
            interval = watch.get("polling_interval_minutes")
            if interval in (None, 0):
                continue
            last_refresh = watch.get("last_refreshed") or watch.get("created_at")
            if not last_refresh:
                continue
            try:
                last_refresh_dt = datetime.fromisoformat(str(last_refresh).replace("Z", "+00:00"))
            except ValueError:
                continue
            if last_refresh_dt.tzinfo is None:
                last_refresh_dt = last_refresh_dt.replace(tzinfo=timezone.utc)
            age_seconds = (now - last_refresh_dt.astimezone(timezone.utc)).total_seconds()
            if age_seconds < int(interval) * 60:
                continue
            try:
                listings = self._client.search(watch["query"])
                repository.replace_watch_listings(
                    watch["id"],
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
                log.info("Polled watch %s", watch["id"])
            except (EbayConfigError, EbayApiError, KeyError) as exc:
                log.warning("Watch poll failed for %s: %s", watch.get("id"), exc)
