"""
Configuration settings for LyxBot API
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # OpenAI Configuration
    openai_api_key: str = ""
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # CORS Configuration
    cors_origins: str = "http://localhost:3000,http://localhost:19006,exp://localhost:19000"
    
    # Model Configuration
    default_model: str = "gpt-3.5-turbo"
    max_tokens: int = 150
    temperature: float = 0.7
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def get_cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
