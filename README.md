# Scoutrr

> Track used gear without babysitting a pile of saved searches.

Scoutrr is a small self-hosted app for watching secondhand tech deals.

I built it because I got tired of doing this by hand. Too many tabs. Too many saved searches. Too much guessing about whether a listing was actually good once shipping got added.

Right now it is focused on eBay. You create watches, pull in live listings, and compare those results against build budgets.

## What it does

- Creates persistent watches for parts, systems, and other gear
- Pulls live eBay listings into each watch
- Ranks top listings by total cost, not just item price
- Tracks builds with budgets and warning thresholds
- Stores sold-history entries for comps
- Exposes a FastAPI backend for the UI and automation hooks
- Handles eBay marketplace account deletion notifications
- Runs fully through Docker Compose

## Feature list

- Dark-mode React dashboard with real page routes
- Watch creation flow wired to live backend ingestion
- Build planner with budget health bars
- Smart search filtering with auto category exclusions + per-watch custom exclusions
- SQLite-backed local persistence
- eBay Browse API integration with OAuth client credentials
- eBay deletion-notification endpoint with challenge validation support
- `.env`-based configuration
- Dockerized backend + frontend services

## Tech stack

- **Backend:** FastAPI + Uvicorn
- **Frontend:** React + Vite
- **Frontend serving:** Nginx
- **Database:** SQLite
- **Deployment style:** Docker Compose

## Install

That’s the whole install flow:

```bash
git clone https://github.com/supremepringles/scoutrr.git
cd scoutrr
cp .env.example .env
# fill in your eBay keys and deletion settings in .env
docker compose up -d
```

Once it is up:

- Frontend: `http://localhost:${FRONTEND_PORT:-3010}`
- Backend API: `http://localhost:${BACKEND_PORT:-8010}`

Notes:

- Docker Compose reads `.env` automatically
- The backend keeps `scoutrr.db` and `scoutrr.log` in a persistent Docker volume mounted at `/data`
- The frontend is built once in Docker and served by Nginx
- If ports `8010` or `3010` are already in use on your machine, change `BACKEND_PORT` or `FRONTEND_PORT` in `.env`

## Required `.env` values

At minimum, fill in:

- `EBAY_CLIENT_ID`
- `EBAY_CLIENT_SECRET`
- `EBAY_DELETION_TOKEN`
- `EBAY_DELETION_ENDPOINT_URL`

Optional:

- `DISCORD_WEBHOOK_URL`
- `EBAY_MARKETPLACE_ID`
- `BUDGET_WARNING_THRESHOLD`

## Getting eBay API keys

You need an eBay Developer Program keyset for live search.

1. Go to https://developer.ebay.com/
2. Sign in or create a developer account
3. Create an application keyset
4. Copy the **Client ID** and **Client Secret** into `.env`
5. For deletion notifications, register the public callback URL and token in the notifications settings

Scoutrr uses:

- `EBAY_CLIENT_ID`
- `EBAY_CLIENT_SECRET`
- `EBAY_DELETION_TOKEN`
- `EBAY_DELETION_ENDPOINT_URL`

## Screenshots

Placeholder for now:

- Dashboard
- Watches page
- Build planner
- Sold comps view

## Roadmap

- Amazon support
- Discord alerts
- Craigslist support
- Better mobile UI
- Mode B sold-listing pull once production eBay access is confirmed (see `docs/MODE_B_SOLD_PULL_FOLLOWUP.md`)
- Import/export for watches and builds

## Contributing

PRs are welcome.

If you want to add a marketplace, clean up the UI, or tighten the backend, feel free.

## Security notes

- Keep real secrets in `.env` only
- Do not commit `.env`, databases, logs, or local build output
- Rotate credentials immediately if they were ever exposed

## License

MIT.
