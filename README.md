# Scoutrr

> Watch used tech like a hawk, without living in fifteen browser tabs.

Scoutrr is a self-hosted deal tracker for homelab people hunting secondhand gear. You give it searches you actually care about, it pulls live eBay listings, keeps a lightweight local database, and helps you compare watch lists against build budgets.

If you've ever had a lab upgrade turn into a mess of saved searches, sticky notes, and "wait, was that OptiPlex actually a good deal?" tabs, that's the problem this project is trying to solve.

## What it does

- Creates persistent watches for parts, systems, and random homelab rabbit holes
- Pulls live eBay listings into each watch
- Calculates top-runner listings by total cost, not just sticker price
- Tracks builds with budgets and warning thresholds
- Stores sold-history entries for comps
- Exposes a small FastAPI backend for the UI and automation hooks
- Ships with systemd units for a clean always-on self-hosted setup
- Handles eBay marketplace account deletion notifications for compliance

## Feature list

- Dark-mode React dashboard
- Watch creation flow wired to live backend ingestion
- Build planner with budget health bars
- SQLite-backed local persistence
- eBay Browse API integration with OAuth client credentials
- eBay deletion-notification endpoint with challenge validation support
- systemd service files for backend and frontend
- Clean `.env`-based configuration

## Tech stack

- **Backend:** FastAPI + Uvicorn
- **Frontend:** React + Vite
- **Database:** SQLite
- **Runtime:** Python 3.12+, Node 20+
- **Deployment style:** self-hosted on a Linux box with systemd

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

Then open `.env` and fill in the values you actually need:

- `EBAY_CLIENT_ID`
- `EBAY_CLIENT_SECRET`
- `EBAY_DELETION_TOKEN`
- `EBAY_DELETION_ENDPOINT_URL`
- optionally `DISCORD_WEBHOOK_URL`

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

If you're deploying somewhere other than `/home/YOUR_USERNAME/projects/scoutrr`, update the paths in both service files before installing them.

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

You’ll need eBay Developer Program credentials for live search.

1. Go to https://developer.ebay.com/
2. Sign in or create a developer account
3. Create an application keyset
4. Copy your **Client ID** and **Client Secret** into `.env`
5. For deletion notifications, register your public callback URL and token in the notifications settings

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

If you deploy this and make it look better, screenshots are very welcome.

## Roadmap

Planned or likely next:

- Amazon support
- Discord alerts for price drops / watch hits
- Craigslist support
- Better mobile UI
- Smarter sold-comp ingestion
- More build-planner quality-of-life stuff

## Contributing

PRs are welcome.

If you want to add marketplaces, improve the frontend, tighten the API, or make the self-hosting story smoother, go for it. Small focused changes are easier to review than giant rewrites.

A few good contribution targets:

- new marketplace adapters
- auth / multi-user groundwork
- richer alerting
- UI cleanup for narrow screens
- import/export tools for watches and builds

## Security notes

- Keep real secrets in `.env` only
- Do not commit `.env`, databases, logs, or local build output
- Rotate any credentials immediately if they were ever exposed

## License

MIT.
