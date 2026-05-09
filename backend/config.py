from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Scoutrr"
    backend_port: int = Field(default=8010, alias="BACKEND_PORT")
    frontend_port: int = Field(default=3010, alias="FRONTEND_PORT")
    database_file: str = Field(default="scoutrr.db", alias="DATABASE_FILE")
    log_file: str = Field(default="scoutrr.log", alias="SCOUTRR_LOG_FILE")
    ebay_app_id: str = Field(default="", alias="EBAY_APP_ID")
    ebay_client_id: str = Field(default="", alias="EBAY_CLIENT_ID")
    ebay_client_secret: str = Field(default="", alias="EBAY_CLIENT_SECRET")
    ebay_marketplace_id: str = Field(default="EBAY_US", alias="EBAY_MARKETPLACE_ID")
    ebay_deletion_token: str = Field(default="", alias="EBAY_DELETION_TOKEN")
    ebay_deletion_endpoint_url: str = Field(default="", alias="EBAY_DELETION_ENDPOINT_URL")
    discord_webhook_url: str = Field(default="", alias="DISCORD_WEBHOOK_URL")
    budget_warning_threshold: float = Field(default=0.9, alias="BUDGET_WARNING_THRESHOLD")


settings = Settings()
