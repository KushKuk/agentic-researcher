"""
Configuration management for the agentic research system.
Loads settings from environment variables with validation.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    google_api_key: str = ""
    anthropic_api_key: Optional[str] = None
    semantic_scholar_api_key: Optional[str] = None
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    environment: str = "development"
    
    # Agent Configuration
    default_model: str = "gemini-pro"
    max_iterations: int = 10
    temperature: float = 0.7
    
    # Phase 4: Vector Memory Configuration
    embedding_model: str = "all-MiniLM-L6-v2"
    vector_db_path: str = "./data/vector_db"
    faiss_index_path: str = "./data/vector_db/faiss_index"
    metadata_path: str = "./data/vector_db/metadata.json"
    
    # Phase 5: Knowledge Graph Configuration
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "password"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

# Validate critical settings
if not settings.google_api_key:
    raise ValueError(
        "GOOGLE_API_KEY is required but not set. "
        "Please add it to your .env file or set it as an environment variable."
    )