"""
NSAI Data - Enterprise-Grade Autonomous Research Platform
Main FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
import logging
from typing import Dict, Any

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

from backend.core.config import settings
from backend.core.logging import setup_logging
from backend.core.exceptions import NSAIDataException
from backend.api import research, dashboard, plugins, auth, billing
from backend.core.rate_limiter import RateLimiterMiddleware
from backend.core.database import init_db
from backend.core.cache import init_cache


# Setup logging
logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    logger.info("Starting NSAI Data application...")
    
    # Initialize database
    await init_db()
    
    # Initialize cache
    await init_cache()
    
    # Initialize Sentry for production
    if settings.APP_ENV == "production" and settings.SENTRY_DSN:
        sentry_logging = LoggingIntegration(
            level=logging.INFO,
            event_level=logging.ERROR
        )
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[FastApiIntegration(), sentry_logging],
            traces_sample_rate=0.1,
            environment=settings.APP_ENV
        )
    
    logger.info("NSAI Data application started successfully")
    yield
    logger.info("Shutting down NSAI Data application...")


# Create FastAPI application
app = FastAPI(
    title="NSAI Data",
    description="Enterprise-Grade Autonomous Research Platform",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan
)

# Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*.nsaidata.com", "localhost", "127.0.0.1"] if settings.APP_ENV == "production" else ["*"]
)
app.add_middleware(RateLimiterMiddleware)

# Prometheus metrics
if settings.ENABLE_ANALYTICS:
    Instrumentator().instrument(app).expose(app)


# Exception handlers
@app.exception_handler(NSAIDataException)
async def nsai_exception_handler(request: Request, exc: NSAIDataException):
    """Handle custom NSAI Data exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "details": exc.details
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred"
        }
    )


# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV
    }


# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(research.router, prefix="/api/v1/research", tags=["Research"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(plugins.router, prefix="/api/v1/plugins", tags=["Plugins"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["Billing"])


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "name": "NSAI Data",
        "version": settings.APP_VERSION,
        "status": "operational",
        "documentation": "/docs" if settings.DEBUG else "https://docs.nsaidata.com"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_config=None  # Use our custom logging
    )