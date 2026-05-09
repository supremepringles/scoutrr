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
                min_price REAL,
                max_price REAL,
                condition TEXT,
                build_id TEXT,
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
                is_active INTEGER NOT NULL DEFAULT 1,
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
