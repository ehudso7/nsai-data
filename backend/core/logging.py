"""
Structured logging configuration for NSAI Data
"""

import logging
import sys
from pathlib import Path
from typing import Any, Dict

import structlog
from structlog.processors import JSONRenderer, TimeStamper, add_log_level
from structlog.stdlib import LoggerFactory

from backend.core.config import settings


def setup_logging():
    """Configure structured logging for the application"""
    
    # Create logs directory if needed
    if settings.LOG_FILE:
        log_path = Path(settings.LOG_FILE)
        log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure standard logging
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format="%(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(settings.LOG_FILE) if settings.LOG_FILE else logging.NullHandler()
        ]
    )
    
    # Configure structlog
    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.CallsiteParameterAdder(
            parameters=[
                structlog.processors.CallsiteParameter.FILENAME,
                structlog.processors.CallsiteParameter.FUNC_NAME,
                structlog.processors.CallsiteParameter.LINENO,
            ]
        ),
    ]
    
    # Add JSON renderer for production
    if settings.LOG_FORMAT == "json":
        processors.append(structlog.processors.dict_tracebacks)
        processors.append(JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())
    
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    return structlog.get_logger()


def get_logger(name: str = None) -> structlog.BoundLogger:
    """Get a logger instance"""
    logger = structlog.get_logger(name)
    
    # Add application context
    logger = logger.bind(
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
        environment=settings.APP_ENV
    )
    
    return logger


class LoggerAdapter:
    """Adapter for request-scoped logging"""
    
    def __init__(self, logger: structlog.BoundLogger, request_id: str):
        self.logger = logger.bind(request_id=request_id)
    
    def info(self, message: str, **kwargs):
        self.logger.info(message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self.logger.warning(message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self.logger.error(message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        self.logger.debug(message, **kwargs)
    
    def exception(self, message: str, **kwargs):
        self.logger.exception(message, **kwargs)
    
    def bind(self, **kwargs) -> "LoggerAdapter":
        """Bind additional context to the logger"""
        self.logger = self.logger.bind(**kwargs)
        return self


def log_request(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    **extra: Dict[str, Any]
):
    """Log HTTP request details"""
    logger = get_logger("http.request")
    logger.info(
        "HTTP Request",
        method=method,
        path=path,
        status_code=status_code,
        duration_ms=duration_ms,
        **extra
    )


def log_research_query(
    query: str,
    user_id: str,
    duration_ms: float,
    success: bool,
    **extra: Dict[str, Any]
):
    """Log research query details"""
    logger = get_logger("research.query")
    logger.info(
        "Research Query",
        query=query,
        user_id=user_id,
        duration_ms=duration_ms,
        success=success,
        **extra
    )


def log_agent_action(
    agent_name: str,
    action: str,
    duration_ms: float,
    success: bool,
    **extra: Dict[str, Any]
):
    """Log agent action details"""
    logger = get_logger(f"agent.{agent_name}")
    logger.info(
        "Agent Action",
        action=action,
        duration_ms=duration_ms,
        success=success,
        **extra
    )


def log_plugin_execution(
    plugin_name: str,
    duration_ms: float,
    success: bool,
    **extra: Dict[str, Any]
):
    """Log plugin execution details"""
    logger = get_logger(f"plugin.{plugin_name}")
    logger.info(
        "Plugin Execution",
        duration_ms=duration_ms,
        success=success,
        **extra
    )


def log_billing_event(
    event_type: str,
    user_id: str,
    amount: float,
    currency: str = "USD",
    **extra: Dict[str, Any]
):
    """Log billing event details"""
    logger = get_logger("billing")
    logger.info(
        "Billing Event",
        event_type=event_type,
        user_id=user_id,
        amount=amount,
        currency=currency,
        **extra
    )