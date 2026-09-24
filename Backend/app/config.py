"""Centralized, env-driven configuration. No secrets or brand text hardcoded here."""
from functools import lru_cache
from pathlib import Path

import yaml
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    # LLM provider (OpenAI-compatible endpoint - works with OpenAI, HF router, Azure-compatible proxies, etc.)
    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4o-mini"

    # Data sources
    database_path: str = str(BASE_DIR / "Database" / "bank_marketing_data.db")
    database_dir: str = str(BASE_DIR / "Database")
    domain_config_path: str = str(BASE_DIR / "app" / "domain_config.yaml")
    conversation_log_path: str = str(BASE_DIR / "conversation_log.txt")

    # Third-party integrations
    serper_api_key: str = ""
    twitter_api_key: str = ""
    twitter_api_secret: str = ""
    twitter_bearer_token: str = ""
    twitter_access_token: str = ""
    twitter_access_token_secret: str = ""

    # SMTP email
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


_active_domain_config_path: str | None = None
_domain_config_cache: dict | None = None


def get_active_domain_config_path() -> str:
    global _active_domain_config_path
    if _active_domain_config_path is None:
        _active_domain_config_path = get_settings().domain_config_path
    return _active_domain_config_path


def set_active_domain_config_path(path: str) -> None:
    """Point the whole agent stack at a different domain_config.yaml at runtime (re-skin on upload)."""
    global _active_domain_config_path, _domain_config_cache
    _active_domain_config_path = path
    _domain_config_cache = None


def get_domain_config() -> dict:
    """Brand/business config, kept out of prompt strings so the same agents can be re-skinned per client/vertical."""
    global _domain_config_cache
    if _domain_config_cache is None:
        with open(get_active_domain_config_path(), "r", encoding="utf-8") as f:
            _domain_config_cache = yaml.safe_load(f)
    return _domain_config_cache


def validate_domain_config(data: dict) -> None:
    """Fails fast with a clear error instead of a confusing Jinja error deep inside a prompt render."""
    if not isinstance(data, dict):
        raise ValueError("domain_config.yaml must contain a YAML mapping (key: value) at the top level.")
    required_paths = [("brand", "name"), ("domain", "industry_scope"), ("segments",)]
    for path in required_paths:
        node = data
        for key in path:
            if not isinstance(node, dict) or key not in node:
                raise ValueError(f"domain_config.yaml is missing required key: {'.'.join(path)}")
            node = node[key]
    if not isinstance(data["segments"], list) or not data["segments"]:
        raise ValueError("domain_config.yaml 'segments' must be a non-empty list.")
