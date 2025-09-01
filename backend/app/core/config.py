"""
Configuration settings for the Noto AI Assistant backend.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App settings
    app_name: str = "Noto AI Assistant Backend"
    app_version: str = "1.0.0-beta"
    debug: bool = Field(default=False, alias="DEBUG")
    
    # Server settings
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    
    # CORS settings
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
        alias="CORS_ORIGINS"
    )
    
    # Ollama AI settings
    ollama_base_url: str = Field(default="http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="codellama:7b-instruct", alias="OLLAMA_MODEL")
    ollama_timeout: int = Field(default=30, alias="OLLAMA_TIMEOUT")
    
    # Ollama generation parameters
    ollama_temperature: float = Field(default=0.2, alias="OLLAMA_TEMPERATURE")
    ollama_top_p: float = Field(default=0.95, alias="OLLAMA_TOP_P")
    ollama_num_predict: int = Field(default=200, alias="OLLAMA_NUM_PREDICT")
    
    # Notion API settings (optional)
    notion_token: Optional[str] = Field(default=None, alias="NOTION_TOKEN")
    notion_database_id: Optional[str] = Field(default=None, alias="NOTION_DATABASE_ID")
    
    # Logging settings
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8"
    }


# Global settings instance
settings = Settings()
