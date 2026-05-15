from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://adpys:adpys@localhost:5432/adpys"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me-in-production"
    debug: bool = False
    api_prefix: str = "/api/v1"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
