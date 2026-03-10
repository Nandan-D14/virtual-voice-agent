"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # E2B Desktop
    e2b_api_key: str = ""

    # Google / Gemini
    google_api_key: str = ""
    google_project_id: str = ""
    google_cloud_region: str = "us-central1"

    # Gemini models
    gemini_live_model: str = "gemini-2.5-flash-native-audio-preview-12-2025"
    gemini_vision_model: str = "gemini-2.5-flash"

    # Kilo Code (OpenAI-compatible gateway — used when google_api_key is empty)
    kilo_api_key: str = ""
    kilo_model_id: str = "minimax/minimax-m2.5:free"
    kilo_gateway_url: str = "https://api.kilo.ai/api/gateway"

    @property
    def use_kilo(self) -> bool:
        """True when Google key is absent and Kilo key is present."""
        return bool(self.kilo_api_key) and not bool(self.google_api_key)

    # Server
    frontend_url: str = "http://localhost:3000"
    host: str = "0.0.0.0"
    port: int = 8000

    # Session
    session_timeout_minutes: int = 15
    jwt_secret: str = "dev-secret-change-in-production"

    # E2B Sandbox defaults
    sandbox_resolution_w: int = 1024
    sandbox_resolution_h: int = 768
    sandbox_timeout_seconds: int = 600


settings = Settings()
