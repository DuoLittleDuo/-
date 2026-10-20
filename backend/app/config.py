"""应用配置。所有配置可通过 backend/.env 或环境变量覆盖。"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"
INDEX_DIR = DATA_DIR / "search"
DEFAULT_DB_PATH = DATA_DIR / "app.db"


class Settings(BaseSettings):
    app_name: str = "柘沟陶宠 API"
    database_url: str = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"

    secret_key: str = "dev-only-change-me"
    access_token_expire_minutes: int = 1440
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173"
    )

    # 语义检索
    semantic_enabled: bool = True
    embedding_model: str = "BAAI/bge-small-zh-v1.5"
    hf_endpoint: str = "https://hf-mirror.com"
    model_cache_dir: Path = BACKEND_DIR / ".cache" / "huggingface"
    min_final_score: float = 0.45
    search_relative_ratio: float = 0.80
    semantic_weight: float = 0.75
    keyword_weight: float = 0.25

    # 演示账号
    seed_admin_username: str = "admin"
    seed_admin_password: str = "admin123456"
    seed_demo_username: str = "demo"
    seed_demo_password: str = "demo123456"

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


settings = Settings()

# 确保运行时目录存在
DATA_DIR.mkdir(parents=True, exist_ok=True)
INDEX_DIR.mkdir(parents=True, exist_ok=True)
settings.model_cache_dir.mkdir(parents=True, exist_ok=True)
