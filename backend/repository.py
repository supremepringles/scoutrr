from __future__ import annotations

from collections import defaultdict
from datetime import datetime
import sqlite3
from typing import Any
from uuid import uuid4

from backend.database import get_connection
from backend.search_config import WATCH_CATEGORIES, WATCH_CONDITIONS, WATCH_REGIONS

POLLING_OPTIONS = {15, 30, 60, 360, 720}
MANUAL_LISTING_SOURCES = {"eBay", "Facebook Marketplace", "Craigslist", "Walmart", "Best Buy", "Amazon", "Other"}
UNIT_METRIC_CATEGORIES = {"Storage - HDD", "Storage - SSD", "RAM"}


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


def _normalize_polling_interval(value: Any) -> int:
    if value in (None, "", "off", "Off", 0, "0"):
        return 0
    minutes = int(value)
    if minutes not in POLLING_OPTIONS:
        raise ValueError("Invalid polling interval")
    return minutes


def _normalize_category(value: Any) -> str:
    category = str(value or "Any").strip() or "Any"
    if category not in WATCH_CATEGORIES:
        raise ValueError("Invalid category")
    return category


def _normalize_condition(value: Any) -> str:
    condition = str(value or "Any").strip() or "Any"
    if condition not in WATCH_CONDITIONS:
        raise ValueError("Invalid condition")
    return condition


def _normalize_listing_source(value: Any) -> str:
    source = str(value or "Other").strip() or "Other"
    if source not in MANUAL_LISTING_SOURCES:
        raise ValueError("Invalid listing source")
    return source


def _normalize_region(value: Any) -> str:
    region = str(value or "US").strip() or "US"
    if region not in WATCH_REGIONS:
        raise ValueError("Invalid region")
    return region


def _parse_capacity_tb(title: str) -> float | None:
    normalized = str(title or "").lower().replace(",", "")
    import re
    matches = re.findall(r"(\d+(?:\.\d+)?)\s*(tb|gb)", normalized)
    if not matches:
        return None
    best_tb = 0.0
    for amount_text, unit in matches:
        amount = float(amount_text)
        tb_value = amount if unit == "tb" else amount / 1024
        if tb_value > best_tb:
            best_tb = tb_value
    return best_tb or None


def _parse_capacity_gb(title: str) -> float | None:
    normalized = str(title or "").lower().replace(",", "")
    import re
    matches = re.findall(r"(\d+(?:\.\d+)?)\s*gb", normalized)
    if not matches:
        return None
    return max(float(amount_text) for amount_text in matches)


def _build_cost_per_unit_label(category: str | None, listing: dict[str, Any]) -> str:
    if category not in UNIT_METRIC_CATEGORIES:
        return ""
    total_cost = _compute_listing_total(listing)
    title = listing.get("title", "")
    if category in {"Storage - HDD", "Storage - SSD"}:
        capacity_tb = _parse_capacity_tb(title)
        if not capacity_tb:
            return ""
        return f"${total_cost / capacity_tb:.2f}/TB"
    capacity_gb = _parse_capacity_gb(title)
    if not capacity_gb:
        return ""
    return f"${total_cost / capacity_gb:.2f}/GB"


class ScoutrrRepository:
    def list_watches(self) -> list[dict[str, Any]]:
        with get_connection() as connection:
            watch_rows = connection.execute(
                """
                SELECT id, name, query, broad, category, user_exclusions, seller_usernames, region, min_price, max_price, condition, build_id,
                       polling_interval_minutes, last_refreshed, top_runner_listing_id,
                       veto_listing_id, created_at, updated_at
                FROM watches
                ORDER BY created_at DESC, name ASC
                """
            ).fetchall()
            listing_rows = connection.execute(
                """
                SELECT id, watch_id, title, price, shipping, condition, source, source_type, notes, listing_age_hours,
                       url, image_url, is_active, is_pinned
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
            listing["is_pinned"] = bool(listing.get("is_pinned"))
            listings_by_watch[listing["watch_id"]].append(listing)

        payload = []
        for watch in watch_rows:
            watch = dict(watch)
            watch["broad"] = bool(watch["broad"])
            listings = sorted(listings_by_watch.get(watch["id"], []), key=lambda item: item["total_cost"])
            for listing in listings:
                listing["cost_per_unit_label"] = _build_cost_per_unit_label(watch.get("category"), listing)
            effective_listing = next((item for item in listings if item.get("is_pinned")), None)
            if effective_listing is None:
                effective_listing = min(listings, key=lambda item: item["total_cost"], default=None)
            watch["top_runner_listing_id"] = effective_listing["id"] if effective_listing else None
            watch["veto_listing_id"] = next((item["id"] for item in listings if item.get("is_pinned")), None)
            watch["top_runner"] = {
                "id": effective_listing["id"],
                "title": effective_listing["title"],
                "total_cost": effective_listing["total_cost"],
                "image_url": effective_listing.get("image_url", ""),
            } if effective_listing else None
            watch["listings"] = listings
            payload.append(watch)
        return payload

    def list_pollable_watches(self) -> list[dict[str, Any]]:
        with get_connection() as connection:
            return connection.execute(
                """
                SELECT id, query, category, user_exclusions, seller_usernames, region, condition, polling_interval_minutes, last_refreshed, created_at
                FROM watches
                WHERE polling_interval_minutes IS NOT NULL
                ORDER BY created_at ASC
                """
            ).fetchall()

    def create_watch(self, payload: dict[str, Any]) -> dict[str, Any]:
        watch_id = payload.get("id") or _new_id("watch")
        polling_interval_minutes = _normalize_polling_interval(payload.get("polling_interval_minutes", 60))
        category = _normalize_category(payload.get("category", "Any"))
        condition = _normalize_condition(payload.get("condition", "Any"))
        region = _normalize_region(payload.get("region", "US"))
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO watches (
                    id, name, query, broad, category, user_exclusions, seller_usernames, region, min_price, max_price, condition, build_id,
                    polling_interval_minutes, veto_listing_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    watch_id,
                    payload["name"],
                    payload["query"],
                    int(bool(payload.get("broad", False))),
                    category,
                    payload.get("user_exclusions"),
                    payload.get("seller_usernames"),
                    region,
                    payload.get("min_price"),
                    payload.get("max_price"),
                    condition,
                    payload.get("build_id"),
                    polling_interval_minutes,
                    payload.get("veto_listing_id"),
                ),
            )
        return self.get_watch(watch_id)

    def update_watch(self, watch_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        fields: list[str] = []
        values: list[Any] = []
        if "polling_interval_minutes" in payload:
            fields.append("polling_interval_minutes = ?")
            values.append(_normalize_polling_interval(payload.get("polling_interval_minutes")))
        if "category" in payload:
            fields.append("category = ?")
            values.append(_normalize_category(payload.get("category")))
        if "user_exclusions" in payload:
            fields.append("user_exclusions = ?")
            values.append(payload.get("user_exclusions") or None)
        if "seller_usernames" in payload:
            fields.append("seller_usernames = ?")
            values.append(payload.get("seller_usernames") or None)
        if "region" in payload:
            fields.append("region = ?")
            values.append(_normalize_region(payload.get("region")))
        if "condition" in payload:
            fields.append("condition = ?")
            values.append(_normalize_condition(payload.get("condition")))
        if not fields:
            return self.get_watch(watch_id)
        values.append(watch_id)
        with get_connection() as connection:
            cursor = connection.execute(
                f"UPDATE watches SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                values,
            )
        if cursor.rowcount == 0:
            raise KeyError(watch_id)
        return self.get_watch(watch_id)

    def delete_watch(self, watch_id: str) -> None:
        with get_connection() as connection:
            cursor = connection.execute("DELETE FROM watches WHERE id = ?", (watch_id,))
        if cursor.rowcount == 0:
            raise KeyError(watch_id)

    def get_watch(self, watch_id: str) -> dict[str, Any]:
        items = [item for item in self.list_watches() if item["id"] == watch_id]
        if not items:
            raise KeyError(watch_id)
        return items[0]

    def create_listing(self, watch_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        listing_id = payload.get("id") or _new_id("listing")
        source_type = payload.get("source_type", "manual")
        if source_type not in {"auto", "manual"}:
            raise ValueError("Invalid listing source type")
        source = payload.get("source", "eBay" if source_type == "auto" else "Other")
        if source_type == "manual":
            source = _normalize_listing_source(source)
        with get_connection() as connection:
            watch_exists = connection.execute("SELECT 1 FROM watches WHERE id = ?", (watch_id,)).fetchone()
            if watch_exists is None:
                raise KeyError(watch_id)
            connection.execute(
                """
                INSERT INTO listings (
                    id, watch_id, title, price, shipping, condition, source, source_type, notes,
                    listing_age_hours, url, image_url, is_active, is_pinned
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    watch_id = excluded.watch_id,
                    title = excluded.title,
                    price = excluded.price,
                    shipping = excluded.shipping,
                    condition = excluded.condition,
                    source = excluded.source,
                    source_type = excluded.source_type,
                    notes = excluded.notes,
                    listing_age_hours = excluded.listing_age_hours,
                    url = excluded.url,
                    image_url = excluded.image_url,
                    is_active = excluded.is_active,
                    is_pinned = excluded.is_pinned,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    listing_id, watch_id, payload["title"], payload["price"], payload.get("shipping", 0),
                    payload.get("condition"), source, source_type, payload.get("notes", ""), payload.get("listing_age_hours", 0),
                    payload.get("url", ""), payload.get("image_url", ""), int(bool(payload.get("is_active", True))),
                    int(bool(payload.get("is_pinned", False))),
                ),
            )
        return self.get_listing(listing_id)

    def replace_watch_listings(self, watch_id: str, listings: list[dict[str, Any]]) -> dict[str, Any]:
        with get_connection() as connection:
            watch_exists = connection.execute("SELECT veto_listing_id FROM watches WHERE id = ?", (watch_id,)).fetchone()
            if watch_exists is None:
                raise KeyError(watch_id)
            pinned_listing_id = watch_exists.get("veto_listing_id")
            connection.execute(
                "UPDATE listings SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE watch_id = ? AND source_type != 'manual'",
                (watch_id,),
            )
            active_ids: set[str] = set()
            for payload in listings:
                listing_id = payload.get("id") or _new_id("listing")
                active_ids.add(listing_id)
                connection.execute(
                    """
                    INSERT INTO listings (
                        id, watch_id, title, price, shipping, condition, source, source_type, notes,
                        listing_age_hours, url, image_url, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'auto', '', ?, ?, ?, 1)
                    ON CONFLICT(id) DO UPDATE SET
                        watch_id = excluded.watch_id,
                        title = excluded.title,
                        price = excluded.price,
                        shipping = excluded.shipping,
                        condition = excluded.condition,
                        source = excluded.source,
                        listing_age_hours = excluded.listing_age_hours,
                        url = excluded.url,
                        image_url = excluded.image_url,
                        is_active = 1,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    (
                        listing_id, watch_id, payload["title"], payload["price"], payload.get("shipping", 0),
                        payload.get("condition"), payload.get("source", "eBay"), payload.get("listing_age_hours", 0),
                        payload.get("url", ""), payload.get("image_url", ""),
                    ),
                )
            manual_ids = {
                row["id"]
                for row in connection.execute(
                    "SELECT id FROM listings WHERE watch_id = ? AND is_active = 1 AND source_type = 'manual'",
                    (watch_id,),
                ).fetchall()
            }
            combined_active_ids = active_ids | manual_ids
            connection.execute("UPDATE listings SET is_pinned = 0 WHERE watch_id = ?", (watch_id,))
            if pinned_listing_id and pinned_listing_id in combined_active_ids:
                connection.execute("UPDATE listings SET is_pinned = 1 WHERE id = ? AND watch_id = ?", (pinned_listing_id, watch_id))
            else:
                pinned_listing_id = None
            connection.execute(
                "UPDATE watches SET veto_listing_id = ?, last_refreshed = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (pinned_listing_id, watch_id),
            )
        return self.get_watch(watch_id)

    def get_listing(self, listing_id: str) -> dict[str, Any]:
        with get_connection() as connection:
            item = connection.execute(
                "SELECT id, watch_id, title, price, shipping, condition, source, source_type, notes, listing_age_hours, url, image_url, is_active, is_pinned FROM listings WHERE id = ?",
                (listing_id,),
            ).fetchone()
        if item is None:
            raise KeyError(listing_id)
        item = dict(item)
        item["total_cost"] = _compute_listing_total(item)
        item["is_active"] = bool(item["is_active"])
        item["is_pinned"] = bool(item.get("is_pinned"))
        return item

    def delete_listing(self, watch_id: str, listing_id: str) -> None:
        with get_connection() as connection:
            cursor = connection.execute("DELETE FROM listings WHERE id = ? AND watch_id = ?", (listing_id, watch_id))
            connection.execute(
                "UPDATE watches SET veto_listing_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND veto_listing_id = ?",
                (watch_id, listing_id),
            )
        if cursor.rowcount == 0:
            raise KeyError(listing_id)

    def set_watch_veto(self, watch_id: str, listing_id: str | None) -> dict[str, Any]:
        with get_connection() as connection:
            watch_exists = connection.execute("SELECT 1 FROM watches WHERE id = ?", (watch_id,)).fetchone()
            if watch_exists is None:
                raise KeyError(watch_id)
            if listing_id is not None:
                listing = connection.execute("SELECT 1 FROM listings WHERE id = ? AND watch_id = ? AND is_active = 1", (listing_id, watch_id)).fetchone()
                if listing is None:
                    raise sqlite3.IntegrityError("listing does not belong to watch")
            connection.execute("UPDATE listings SET is_pinned = 0 WHERE watch_id = ?", (watch_id,))
            if listing_id is not None:
                connection.execute("UPDATE listings SET is_pinned = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND watch_id = ?", (listing_id, watch_id))
            connection.execute("UPDATE watches SET veto_listing_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (listing_id, watch_id))
        return self.get_watch(watch_id)

    def list_builds(self) -> list[dict[str, Any]]:
        watches = self.list_watches()
        watches_by_build: dict[str | None, list[dict[str, Any]]] = defaultdict(list)
        for watch in watches:
            watches_by_build[watch.get("build_id")].append(watch)
        with get_connection() as connection:
            build_rows = connection.execute("SELECT id, name, budget, warning_threshold FROM builds ORDER BY created_at DESC, name ASC").fetchall()
        payload = []
        for build in build_rows:
            build = dict(build)
            child_watches = watches_by_build.get(build["id"], [])
            cost = sum(float(watch.get("top_runner", {}).get("total_cost", 0) or 0) for watch in child_watches)
            build["cost"] = round(cost, 2)
            build["watch_count"] = len(child_watches)
            build["status"] = _build_status(build["cost"], float(build["budget"]), float(build["warning_threshold"]))
            build["watches"] = child_watches
            payload.append(build)
        return payload

    def create_build(self, payload: dict[str, Any]) -> dict[str, Any]:
        build_id = payload.get("id") or _new_id("build")
        with get_connection() as connection:
            connection.execute("INSERT INTO builds (id, name, budget, warning_threshold) VALUES (?, ?, ?, ?)", (build_id, payload["name"], payload["budget"], payload.get("warning_threshold", 0.9)))
        items = [item for item in self.list_builds() if item["id"] == build_id]
        if not items:
            raise KeyError(build_id)
        return items[0]

    def delete_build(self, build_id: str) -> None:
        with get_connection() as connection:
            cursor = connection.execute("DELETE FROM builds WHERE id = ?", (build_id,))
        if cursor.rowcount == 0:
            raise KeyError(build_id)

    def list_sold_history(self, query: str | None = None, months: float | None = None, platform: str | None = None, condition: str | None = None) -> list[dict[str, Any]]:
        sql = "SELECT id, query, title, sold_price, shipping, source, platform, condition, notes, source_type, sold_at, listing_url, pinned, created_at, updated_at FROM sold_history"
        clauses = []
        params: list[Any] = []
        if query:
            clauses.append("(query LIKE ? OR title LIKE ?)")
            params.extend([f"%{query}%", f"%{query}%"])
        if platform:
            clauses.append("platform = ?")
            params.append(platform)
        if condition:
            clauses.append("condition = ?")
            params.append(condition)
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
        sold_at = payload.get("sold_at") or datetime.utcnow().date().isoformat()
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO sold_history (id, query, title, sold_price, shipping, source, platform, condition, notes, source_type, sold_at, listing_url, pinned)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    query = excluded.query, title = excluded.title, sold_price = excluded.sold_price,
                    shipping = excluded.shipping, source = excluded.source, platform = excluded.platform,
                    condition = excluded.condition, notes = excluded.notes, source_type = excluded.source_type,
                    sold_at = excluded.sold_at, listing_url = excluded.listing_url, pinned = excluded.pinned,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (history_id, payload.get("query") or payload["title"], payload["title"], payload["sold_price"], payload.get("shipping", 0), payload.get("source") or payload.get("platform", "Other"), payload.get("platform", "Other"), payload.get("condition"), payload.get("notes", ""), payload.get("source_type", "Manual"), sold_at, payload.get("listing_url", ""), int(bool(payload.get("pinned", False)))),
            )
        items = [item for item in self.list_sold_history() if item["id"] == history_id]
        if not items:
            raise KeyError(history_id)
        return items[0]

    def delete_sold_history(self, history_id: str) -> None:
        with get_connection() as connection:
            cursor = connection.execute("DELETE FROM sold_history WHERE id = ?", (history_id,))
        if cursor.rowcount == 0:
            raise KeyError(history_id)

repository = ScoutrrRepository()
