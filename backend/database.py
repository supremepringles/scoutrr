from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from backend.config import ROOT, settings

DB_PATH = ROOT / settings.database_file


def dict_row_factory(cursor: sqlite3.Cursor, row: tuple[Any, ...]) -> dict[str, Any]:
    return {column[0]: row[index] for index, column in enumerate(cursor.description)}


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = dict_row_factory
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def _column_exists(connection: sqlite3.Connection, table: str, column: str) -> bool:
    rows = connection.execute(f"PRAGMA table_info({table})").fetchall()
    return any(row["name"] == column for row in rows)


def _ensure_column(connection: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    if not _column_exists(connection, table, column):
        connection.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def init_db() -> None:
    Path(DB_PATH).touch(exist_ok=True)
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS builds (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                budget REAL NOT NULL,
                warning_threshold REAL NOT NULL DEFAULT 0.9,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS watches (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                query TEXT NOT NULL,
                broad INTEGER NOT NULL DEFAULT 0,
                category TEXT NOT NULL DEFAULT 'Any',
                user_exclusions TEXT,
                min_price REAL,
                max_price REAL,
                condition TEXT,
                build_id TEXT,
                polling_interval_minutes INTEGER NOT NULL DEFAULT 60,
                last_refreshed TEXT,
                top_runner_listing_id TEXT,
                veto_listing_id TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE SET NULL,
                FOREIGN KEY (top_runner_listing_id) REFERENCES listings(id) ON DELETE SET NULL,
                FOREIGN KEY (veto_listing_id) REFERENCES listings(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS listings (
                id TEXT PRIMARY KEY,
                watch_id TEXT NOT NULL,
                title TEXT NOT NULL,
                price REAL NOT NULL,
                shipping REAL NOT NULL DEFAULT 0,
                condition TEXT,
                source TEXT NOT NULL DEFAULT 'eBay',
                listing_age_hours INTEGER NOT NULL DEFAULT 0,
                url TEXT NOT NULL DEFAULT '',
                image_url TEXT NOT NULL DEFAULT '',
                is_active INTEGER NOT NULL DEFAULT 1,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (watch_id) REFERENCES watches(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS sold_history (
                id TEXT PRIMARY KEY,
                query TEXT NOT NULL,
                title TEXT NOT NULL,
                sold_price REAL NOT NULL,
                shipping REAL NOT NULL DEFAULT 0,
                source TEXT NOT NULL DEFAULT 'eBay',
                platform TEXT NOT NULL DEFAULT 'Other',
                condition TEXT,
                notes TEXT NOT NULL DEFAULT '',
                source_type TEXT NOT NULL DEFAULT 'Manual',
                sold_at TEXT NOT NULL,
                listing_url TEXT NOT NULL DEFAULT '',
                pinned INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_watches_build_id ON watches(build_id);
            CREATE INDEX IF NOT EXISTS idx_listings_watch_id ON listings(watch_id);
            CREATE INDEX IF NOT EXISTS idx_history_query ON sold_history(query);
            """
        )

        _ensure_column(connection, "watches", "category", "TEXT NOT NULL DEFAULT 'Any'")
        _ensure_column(connection, "watches", "user_exclusions", "TEXT")
        _ensure_column(connection, "watches", "polling_interval_minutes", "INTEGER NOT NULL DEFAULT 60")
        _ensure_column(connection, "watches", "last_refreshed", "TEXT")
        _ensure_column(connection, "listings", "image_url", "TEXT NOT NULL DEFAULT ''")
        _ensure_column(connection, "listings", "is_pinned", "INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "sold_history", "platform", "TEXT NOT NULL DEFAULT 'Other'")
        _ensure_column(connection, "sold_history", "condition", "TEXT")
        _ensure_column(connection, "sold_history", "notes", "TEXT NOT NULL DEFAULT ''")
        _ensure_column(connection, "sold_history", "source_type", "TEXT NOT NULL DEFAULT 'Manual'")

        connection.execute("UPDATE watches SET category = 'Any' WHERE category IS NULL OR trim(category) = ''")
        connection.execute("UPDATE watches SET polling_interval_minutes = 60 WHERE polling_interval_minutes IS NULL")
        connection.execute("UPDATE listings SET is_pinned = 0 WHERE is_pinned IS NULL")
        connection.execute(
            """
            UPDATE sold_history
            SET platform = CASE
                WHEN platform IS NULL OR trim(platform) = '' THEN COALESCE(NULLIF(source, ''), 'Other')
                ELSE platform
            END
            """
        )
        connection.execute("UPDATE sold_history SET source_type = 'Manual' WHERE source_type IS NULL OR trim(source_type) = ''")
