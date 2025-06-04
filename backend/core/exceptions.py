"""
Custom exceptions for NSAI Data
"""

from typing import Any, Dict, Optional
from fastapi import status


class NSAIDataException(Exception):
    """Base exception for NSAI Data"""
    
    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(NSAIDataException):
    """Authentication failed"""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )


class AuthorizationError(NSAIDataException):
    """Authorization failed"""
    
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )


class ValidationError(NSAIDataException):
    """Validation failed"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details
        )


class ResourceNotFoundError(NSAIDataException):
    """Resource not found"""
    
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} not found",
            error_code="RESOURCE_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": str(identifier)}
        )


class RateLimitError(NSAIDataException):
    """Rate limit exceeded"""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        details = {}
        if retry_after:
            details["retry_after"] = retry_after
        
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=details
        )


class ResearchError(NSAIDataException):
    """Research operation failed"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="RESEARCH_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


class AgentError(NSAIDataException):
    """Agent operation failed"""
    
    def __init__(self, agent_name: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Agent '{agent_name}' error: {message}",
            error_code="AGENT_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"agent": agent_name, **(details or {})}
        )


class PluginError(NSAIDataException):
    """Plugin operation failed"""
    
    def __init__(self, plugin_name: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Plugin '{plugin_name}' error: {message}",
            error_code="PLUGIN_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"plugin": plugin_name, **(details or {})}
        )


class WebScrapingError(NSAIDataException):
    """Web scraping failed"""
    
    def __init__(self, url: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Failed to scrape {url}: {message}",
            error_code="WEB_SCRAPING_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"url": url, **(details or {})}
        )


class AIServiceError(NSAIDataException):
    """AI service error"""
    
    def __init__(self, service: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"AI service '{service}' error: {message}",
            error_code="AI_SERVICE_ERROR",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"service": service, **(details or {})}
        )


class BillingError(NSAIDataException):
    """Billing operation failed"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="BILLING_ERROR",
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            details=details
        )


class EmailError(NSAIDataException):
    """Email operation failed"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="EMAIL_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


class TimeoutError(NSAIDataException):
    """Operation timed out"""
    
    def __init__(self, operation: str, timeout: int):
        super().__init__(
            message=f"Operation '{operation}' timed out after {timeout} seconds",
            error_code="TIMEOUT_ERROR",
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            details={"operation": operation, "timeout": timeout}
        )


class ConfigurationError(NSAIDataException):
    """Configuration error"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )