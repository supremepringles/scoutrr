from __future__ import annotations

import logging
from threading import Event, Thread
from time import sleep

log = logging.getLogger(__name__)


class WatchPoller:
    def __init__(self, interval_seconds: int = 900):
        self.interval_seconds = interval_seconds
        self._stop = Event()
        self._thread: Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._thread = Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def _run(self) -> None:
        while not self._stop.is_set():
            log.info("Watch poller heartbeat")
            sleep(self.interval_seconds)
