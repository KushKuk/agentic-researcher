"""
Configuration management for the agentic research system.
Loads settings from environment variables with validation.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    openai_api_key: str
    anthropic_api_key: Optional[str] = None
    semantic_scholar_api_key: Optional[str] = None
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    environment: str = "development"
    
    # Agent Configuration
    default_model: str = "gpt-4-turbo-preview"
    max_iterations: int = 10
    temperature: float = 0.7
    
    # Future: Database paths
    faiss_index_path: Optional[str] = None
    neo4j_uri: Optional[str] = None
    neo4j_user: Optional[str] = None
    neo4j_password: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()