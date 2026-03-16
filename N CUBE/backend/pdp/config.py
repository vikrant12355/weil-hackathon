"""
pdp/config.py
Centralised settings loaded from environment variables / .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── App ──────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./pdp.db"

    # ── Blockchain ───────────────────────────────────────────────────────────
    WEB3_PROVIDER_URI: str = "http://127.0.0.1:8545"   # default: local Ganache
    CHAIN_ID: int = 1337
    CONTRACT_ADDRESS: str = "0x0000000000000000000000000000000000000000"
    DEPLOYER_PRIVATE_KEY: str = "0x0000000000000000000000000000000000000000000000000000000000000000"


settings = Settings()
