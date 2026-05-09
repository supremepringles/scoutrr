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
- Includes systemd units for running it full-time
- Handles eBay marketplace account deletion notifications

## Feature list

- Dark-mode React dashboard
- Watch creation flow wired to live backend ingestion
- Build planner with budget health bars
- SQLite-backed local persistence
- eBay Browse API integration with OAuth client credentials
- eBay deletion-notification endpoint with challenge validation support
- systemd service files for backend and frontend
- `.env`-based configuration

## Tech stack

- **Backend:** FastAPI + Uvicorn
- **Frontend:** React + Vite
- **Database:** SQLite
- **Runtime:** Python 3.12+, Node 20+
- **Deployment style:** Linux box with systemd

## Self-hosted setup

### 1) Clone the repo

```bash
git clone https://github.com/yourname/scoutrr.git
cd scoutrr
```

### 2) Copy the example env file

```bash
cp .env.example .env
```

Then fill in the values you need in `.env`:

- `EBAY_CLIENT_ID`
- `EBAY_CLIENT_SECRET`
- `EBAY_DELETION_TOKEN`
- `EBAY_DELETION_ENDPOINT_URL`
- optional: `DISCORD_WEBHOOK_URL`

### 3) Create the Python venv and install backend deps

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4) Install frontend deps

```bash
cd frontend
npm install
cd ..
```

### 5) Install the systemd services

Before installing them, open both service files and replace `YOUR_USERNAME` with your actual Linux username everywhere, including the `User=` line and all `/home/YOUR_USERNAME/...` paths.

```bash
sudo install -m 0644 /home/YOUR_USERNAME/projects/scoutrr/systemd/scoutrr-backend.service /etc/systemd/system/scoutrr-backend.service
sudo install -m 0644 /home/YOUR_USERNAME/projects/scoutrr/systemd/scoutrr-frontend.service /etc/systemd/system/scoutrr-frontend.service
sudo systemctl daemon-reload
sudo systemctl enable --now scoutrr-backend.service
sudo systemctl enable --now scoutrr-frontend.service
```

If your repo lives somewhere else, update the paths in both service files first.

### 6) Check service status

```bash
systemctl status scoutrr-backend.service scoutrr-frontend.service
```

### Optional: run it manually first

Backend:

```bash
source venv/bin/activate
python -m backend.main
```

Frontend:

```bash
cd frontend
VITE_API_BASE_URL=http://127.0.0.1:8010 npm run dev
```

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
