from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Listing:
    id: str
    title: str
    price: float
    shipping: float
    condition: str
    source: str = "eBay"
    listing_age_hours: int = 0
    url: str = ""
    image_url: str = ""
    vetoed: bool = False
    is_pinned: bool = False

    @property
    def total_cost(self) -> float:
        return round(self.price + self.shipping, 2)


@dataclass
class Watch:
    id: str
    name: str
    query: str
    broad: bool
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    condition: Optional[str] = None
    top_runner_id: Optional[str] = None
    veto_listing_id: Optional[str] = None
    polling_interval_minutes: Optional[int] = 60
    last_refreshed: Optional[str] = None
    listings: List[Listing] = field(default_factory=list)


@dataclass
class Build:
    id: str
    name: str
    budget: float
    watch_ids: List[str] = field(default_factory=list)
