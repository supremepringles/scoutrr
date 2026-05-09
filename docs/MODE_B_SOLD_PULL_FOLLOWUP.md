# Mode B Follow-Up: eBay Sold Pull

This package is the handoff for enabling Scoutrr's sold-listing pull once production eBay API access is confirmed.

## Goal

Add a user-controlled sold-comps workflow where Scoutrr can:
- search real sold eBay listings
- show temporary results without auto-saving
- let the user pin only the comps they want to keep
- save pinned results into `sold_history`

## Current Status

Mode A (manual sold comp entry) is live.

Mode B is intentionally gated in the UI with a clear coming-soon message because sold/completed listing access has **not** been verified on the production keyset yet.

## Blocking Requirement

Before implementation is turned on, verify that the production eBay app/keyset can access a sold/completed listings endpoint that returns:
- title
- sold price
- shipping
- condition
- sold date
- listing URL
- image

If the endpoint is limited-release, partner-only, marketplace-specific, or absent from the production keyset, keep Mode B disabled.

## What To Verify With eBay

1. Which endpoint is the approved production source for sold/completed listings?
2. Is it available on the existing production keyset?
3. What auth scope is required?
4. Are there result-window, pagination, or retention limits?
5. Are sold date filters supported server-side?
6. Are condition filters supported server-side?
7. Are shipping and image fields included directly in the payload?
8. Are there rate limits different from normal Browse search?

## Backend Work Plan

### 1) Add sold-search client method
Add a dedicated method in `backend/scrapers/ebay.py`, separate from active listing search.

Suggested shape:

```python
client.search_sold(
    query: str,
    date_range: str,
    condition: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    too_old_months: float | None = None,
    limit: int = 50,
)
```

Expected normalized payload per result:

```python
{
    "id": str,
    "title": str,
    "sold_price": float,
    "shipping": float,
    "platform": "eBay",
    "condition": str | None,
    "sold_at": str | None,
    "listing_url": str,
    "image_url": str,
    "source_type": "eBay Pull",
}
```

### 2) Add temporary sold-search API route
Create a non-persisting endpoint, for example:

- `POST /history/search-ebay`

Request body:

```json
{
  "query": "thinkcentre tiny",
  "date_range": "3m",
  "condition": "Used",
  "min_price": 50,
  "max_price": 180,
  "too_old_months": 6
}
```

Response:

```json
{
  "query": "thinkcentre tiny",
  "items": [...],
  "source": "ebay-sold"
}
```

Important:
- do **not** save search results automatically
- do **not** mix temporary results into `sold_history`
- fail cleanly with a useful API-access error if sold endpoint access is missing

### 3) Add selective pin/save route
Create a persistence endpoint that takes one or more chosen sold results and saves them into `sold_history`.

Suggested route:
- `POST /history/import-ebay`

Behavior:
- accept one or multiple selected results
- normalize fields to the existing `sold_history` schema
- save `source_type = "eBay Pull"`
- save `platform = "eBay"`
- preserve `listing_url`, `condition`, `sold_at`, `shipping`

## Frontend Work Plan

### 1) Replace static coming-soon card when access is confirmed
In `frontend/src/pages/History.jsx`:
- keep Manual Add as Mode A
- add a real Mode B search panel beside or below it

### 2) Mode B search controls
Required controls:
- search query
- date range selector: 1 week, 1 month, 3 months, 6 months, 1 year
- condition filter
- min price
- max price
- too-old filter in months

### 3) Temporary results list
Display pulled results in a separate results area.

Each row/card should show:
- image
- title
- sold price
- shipping
- condition
- sold date
- link to listing
- pin/save button

Rules:
- results disappear when the page reloads or a new pull runs
- unpinned results are never saved
- saved results should refresh the main sold-history table

### 4) Error states
If API access fails or is unavailable:
- show a clear inline error
- keep the rest of the history page functional
- do not break Manual Add

## Data Rules

- Active listings and sold comps remain separate views
- Mode B results are ephemeral until explicitly saved
- Saved rows go only into `sold_history`
- `source_type` must distinguish `Manual` vs `eBay Pull`

## Suggested Acceptance Checklist

- [ ] Production eBay sold endpoint confirmed and documented
- [ ] Temporary sold search endpoint works
- [ ] Filters work without auto-saving
- [ ] User can selectively save one or many results
- [ ] Saved results appear in sold-history table with `source_type = eBay Pull`
- [ ] Manual Mode A still works unchanged
- [ ] Broken/missing API access shows a clean inline error
- [ ] `python3 -m compileall backend` passes
- [ ] `npm run build` passes

## Notes For Resume

Current UI already tells the truth: Mode B is blocked on extra API access.

Once access is confirmed, this file is the implementation handoff. No product re-decisions should be needed.