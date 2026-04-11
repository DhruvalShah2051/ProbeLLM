from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    judge_provider: str = "openai"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    groq_api_key: str = ""
    debug: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()