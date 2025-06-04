"""
Configuration management for NSAI Data
"""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, validator


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Application
    APP_NAME: str = Field(default="NSAI_Data")
    APP_VERSION: str = Field(default="1.0.0")
    APP_ENV: str = Field(default="development")
    DEBUG: bool = Field(default=False)
    
    # API Configuration
    API_HOST: str = Field(default="0.0.0.0")
    API_PORT: int = Field(default=8000)
    API_BASE_URL: str = Field(default="http://localhost:8000")
    
    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_EXPIRATION_HOURS: int = Field(default=24)
    API_KEY_SALT: str = Field(..., min_length=16)
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = Field(...)
    OPENAI_MODEL: str = Field(default="gpt-4-turbo")
    OPENAI_MAX_TOKENS: int = Field(default=8000)
    OPENAI_TEMPERATURE: float = Field(default=0.7)
    
    # Firecrawl Configuration
    FIRECRAWL_API_KEY: Optional[str] = Field(default=None)
    FIRECRAWL_BASE_URL: str = Field(default="https://api.firecrawl.dev")
    
    # Database Configuration
    DATABASE_URL: Optional[str] = Field(default=None)
    REDIS_URL: Optional[str] = Field(default="redis://localhost:6379/0")
    
    # Supabase Configuration
    SUPABASE_URL: Optional[str] = Field(default=None)
    SUPABASE_KEY: Optional[str] = Field(default=None)
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: Optional[str] = Field(default=None)
    STRIPE_PUBLISHABLE_KEY: Optional[str] = Field(default=None)
    STRIPE_WEBHOOK_SECRET: Optional[str] = Field(default=None)
    
    # Email Configuration
    SENDGRID_API_KEY: Optional[str] = Field(default=None)
    EMAIL_FROM: str = Field(default="noreply@nsaidata.com")
    EMAIL_FROM_NAME: str = Field(default="NSAI Data")
    
    # Sentry Configuration
    SENTRY_DSN: Optional[str] = Field(default=None)
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100)
    RATE_LIMIT_PERIOD: int = Field(default=3600)
    
    # Plugin System
    PLUGIN_DIRECTORY: str = Field(default="/app/plugins")
    PLUGIN_TIMEOUT: int = Field(default=30)
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="json")
    LOG_FILE: Optional[str] = Field(default=None)
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:3000"])
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True)
    
    # Feature Flags
    ENABLE_PLUGINS: bool = Field(default=True)
    ENABLE_BILLING: bool = Field(default=True)
    ENABLE_EMAIL_NOTIFICATIONS: bool = Field(default=True)
    ENABLE_ANALYTICS: bool = Field(default=True)
    
    # Performance
    MAX_CONCURRENT_QUERIES: int = Field(default=1000)
    QUERY_TIMEOUT: int = Field(default=60)
    CACHE_TTL: int = Field(default=3600)
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("APP_ENV")
    def validate_app_env(cls, v):
        """Validate application environment"""
        allowed_envs = ["development", "staging", "production"]
        if v not in allowed_envs:
            raise ValueError(f"APP_ENV must be one of {allowed_envs}")
        return v
    
    @validator("LOG_LEVEL")
    def validate_log_level(cls, v):
        """Validate log level"""
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            raise ValueError(f"LOG_LEVEL must be one of {allowed_levels}")
        return v.upper()
    
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.APP_ENV == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.APP_ENV == "development"
    
    def get_redis_url(self) -> str:
        """Get Redis URL with fallback"""
        return self.REDIS_URL or "redis://localhost:6379/0"
    
    def get_database_url(self) -> str:
        """Get database URL with fallback"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        # Fallback to SQLite for development
        return "sqlite:///./nsaidata.db"


# Create settings instance
settings = Settings()