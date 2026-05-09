from __future__ import annotations

import logging
import socket

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import ROOT, settings
from backend.database import init_db
from backend.routes import alerts, builds, ebay, history, search, watches
from backend.scheduler import WatchPoller

LOG_PATH = ROOT / settings.log_file
LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    handlers=[logging.FileHandler(LOG_PATH), logging.StreamHandler()],
)
log = logging.getLogger("scoutrr")
poller = WatchPoller()

app = FastAPI(title="Scoutrr API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(search.router)
app.include_router(watches.router)
app.include_router(builds.router)
app.include_router(alerts.router)
app.include_router(history.router)
app.include_router(ebay.router)


@app.on_event("startup")
def startup() -> None:
    init_db()
    poller.start()


@app.on_event("shutdown")
def shutdown() -> None:
    poller.stop()


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "theme": "thinkcentre-dark",
        "accent": "lenovo-red",
        "frontend_port": settings.frontend_port,
        "database_file": settings.database_file,
    }


def ensure_port_available(port: int) -> None:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if sock.connect_ex(("127.0.0.1", port)) == 0:
            message = f"Port {port} is already in use. Set a different BACKEND_PORT in .env and restart."
            log.error(message)
            raise SystemExit(message)


if __name__ == "__main__":
    ensure_port_available(settings.backend_port)
    log.info("Starting Scoutrr backend on port %s", settings.backend_port)
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.backend_port, reload=True)
