from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    allowed_origins: str = "http://localhost:5173"
    attack_library_path: str = "../attack-library"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    groq_api_key: str = ""
    debug: bool = False
    secret_key: str = "change-this-in-production"        # add this
    access_token_expire_minutes: int = 60                 # add this

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()