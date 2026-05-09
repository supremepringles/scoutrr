from __future__ import annotations

from collections import defaultdict
from typing import Any
from uuid import uuid4

from backend.database import get_connection


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:12]}"


def _compute_listing_total(listing: dict[str, Any]) -> float:
    return round(float(listing["price"]) + float(listing["shipping"]), 2)


def _build_status(cost: float, budget: float, warning_threshold: float) -> str:
    if budget <= 0:
        return "healthy"
    ratio = cost / budget
    if ratio >= 1:
        return "exceeded"
    if ratio >= warning_threshold:
        return "warning"
    return "healthy"


class ScoutrrRepository:
    def list_watches(self) -> list[dict[str, Any]]:
        with get_connection() as connection:
            watch_rows = connection.execute(
                """
                SELECT id, name, query, broad, min_price, max_price, condition, build_id,
                       top_runner_listing_id, veto_listing_id
                FROM watches
                ORDER BY created_at DESC, name ASC
                """
            ).fetchall()
            listing_rows = connection.execute(
                """
                SELECT id, watch_id, title, price, shipping, condition, source, listing_age_hours, url, is_active
                FROM listings
                WHERE is_active = 1
                ORDER BY created_at DESC
                """
            ).fetchall()

        listings_by_watch: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for listing in listing_rows:
            listing = dict(listing)
            listing["total_cost"] = _compute_listing_total(listing)
            listing["is_active"] = bool(listing["is_active"])
            listings_by_watch[listing["watch_id"]].append(listing)

        payload = []
        for watch in watch_rows:
            watch = dict(watch)
            watch["broad"] = bool(watch["broad"])
            listings = listings_by_watch.get(watch["id"], [])
            effective_listing = next((item for item in listings if item["id"] == watch["veto_listing_id"]), None)
            if effective_listing is None:
                effective_listing = min(listings, key=lambda item: item["total_cost"], default=None)
            if effective_listing is not None:
                watch["top_runner_listing_id"] = effective_listing["id"]
                watch["top_runner"] = {
                    "id": effective_listing["id"],
                    "title": effective_listing["title"],
                    "total_cost": effective_listing["total_cost"],
                }
            else:
                watch["top_runner"] = None
            watch["listings"] = listings
            payload.append(watch)
        return payload

    def create_watch(self, payload: dict[str, Any]) -> dict[str, Any]:
        watch_id = payload.get("id") or _new_id("watch")
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO watches (id, name, query, broad, min_price, max_price, condition, build_id, veto_listing_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    watch_id,
                    payload["name"],
                    payload["query"],
                    int(bool(payload.get("broad", False))),
                    payload.get("min_price"),
                    payload.get("max_price"),
                    payload.get("condition"),
                    payload.get("build_id"),
                    payload.get("veto_listing_id"),
                ),
            )
        return self.get_watch(watch_id)

    def get_watch(self, watch_id: str) -> dict[str, Any]:
        items = [item for item in self.list_watches() if item["id"] == watch_id]
        if not items:
            raise KeyError(watch_id)
        return items[0]

    def create_listing(self, watch_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        listing_id = payload.get("id") or _new_id("listing")
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO listings (id, watch_id, title, price, shipping, condition, source, listing_age_hours, url, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    watch_id = excluded.watch_id,
                    title = excluded.title,
                    price = excluded.price,
                    shipping = excluded.shipping,
                    condition = excluded.condition,
                    source = excluded.source,
                    listing_age_hours = excluded.listing_age_hours,
                    url = excluded.url,
                    is_active = excluded.is_active,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    listing_id,
                    watch_id,
                    payload["title"],
                    payload["price"],
                    payload.get("shipping", 0),
                    payload.get("condition"),
                    payload.get("source", "eBay"),
                    payload.get("listing_age_hours", 0),
                    payload.get("url", ""),
                    int(bool(payload.get("is_active", True))),
                ),
            )
        return self.get_listing(listing_id)

    def get_listing(self, listing_id: str) -> dict[str, Any]:
        with get_connection() as connection:
            item = connection.execute(
                """
                SELECT id, watch_id, title, price, shipping, condition, source, listing_age_hours, url, is_active
                FROM listings
                WHERE id = ?
                """,
                (listing_id,),
            ).fetchone()
        if item is None:
            raise KeyError(listing_id)
        item = dict(item)
        item["total_cost"] = _compute_listing_total(item)
        item["is_active"] = bool(item["is_active"])
        return item

    def set_watch_veto(self, watch_id: str, listing_id: str | None) -> dict[str, Any]:
        with get_connection() as connection:
            connection.execute(
                "UPDATE watches SET veto_listing_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (listing_id, watch_id),
            )
        return self.get_watch(watch_id)

    def list_builds(self) -> list[dict[str, Any]]:
        watches = self.list_watches()
        watches_by_build: dict[str | None, list[dict[str, Any]]] = defaultdict(list)
        for watch in watches:
            watches_by_build[watch.get("build_id")].append(watch)

        with get_connection() as connection:
            build_rows = connection.execute(
                "SELECT id, name, budget, warning_threshold FROM builds ORDER BY created_at DESC, name ASC"
            ).fetchall()

        payload = []
        for build in build_rows:
            build = dict(build)
            child_watches = watches_by_build.get(build["id"], [])
            cost = 0.0
            for watch in child_watches:
                runner = watch.get("top_runner")
                if runner:
                    cost += float(runner["total_cost"])
            build["cost"] = round(cost, 2)
            build["watch_count"] = len(child_watches)
            build["status"] = _build_status(build["cost"], float(build["budget"]), float(build["warning_threshold"]))
            build["watches"] = child_watches
            payload.append(build)
        return payload

    def create_build(self, payload: dict[str, Any]) -> dict[str, Any]:
        build_id = payload.get("id") or _new_id("build")
        with get_connection() as connection:
            connection.execute(
                "INSERT INTO builds (id, name, budget, warning_threshold) VALUES (?, ?, ?, ?)",
                (
                    build_id,
                    payload["name"],
                    payload["budget"],
                    payload.get("warning_threshold", 0.9),
                ),
            )
        items = [item for item in self.list_builds() if item["id"] == build_id]
        if not items:
            raise KeyError(build_id)
        return items[0]

    def list_sold_history(self, query: str | None = None, months: float | None = None) -> list[dict[str, Any]]:
        sql = "SELECT id, query, title, sold_price, shipping, source, sold_at, listing_url, pinned FROM sold_history"
        clauses = []
        params: list[Any] = []
        if query:
            clauses.append("query LIKE ?")
            params.append(f"%{query}%")
        if months is not None:
            clauses.append("datetime(sold_at) >= datetime('now', ?)")
            params.append(f"-{months * 30:.0f} days")
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        sql += " ORDER BY datetime(sold_at) DESC, created_at DESC"
        with get_connection() as connection:
            rows = connection.execute(sql, params).fetchall()
        items = []
        for row in rows:
            row = dict(row)
            row["pinned"] = bool(row["pinned"])
            row["total_cost"] = _compute_listing_total({"price": row["sold_price"], "shipping": row["shipping"]})
            items.append(row)
        return items

    def create_sold_history(self, payload: dict[str, Any]) -> dict[str, Any]:
        history_id = payload.get("id") or _new_id("sold")
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO sold_history (id, query, title, sold_price, shipping, source, sold_at, listing_url, pinned)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    query = excluded.query,
                    title = excluded.title,
                    sold_price = excluded.sold_price,
                    shipping = excluded.shipping,
                    source = excluded.source,
                    sold_at = excluded.sold_at,
                    listing_url = excluded.listing_url,
                    pinned = excluded.pinned,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    history_id,
                    payload["query"],
                    payload["title"],
                    payload["sold_price"],
                    payload.get("shipping", 0),
                    payload.get("source", "eBay"),
                    payload["sold_at"],
                    payload.get("listing_url", ""),
                    int(bool(payload.get("pinned", False))),
                ),
            )
        items = [item for item in self.list_sold_history() if item["id"] == history_id]
        if not items:
            raise KeyError(history_id)
        return items[0]


repository = ScoutrrRepository()
