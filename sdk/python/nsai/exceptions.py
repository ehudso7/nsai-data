"""
NSAI Data Exceptions
Custom exceptions for the NSAI SDK
"""


class NSAIError(Exception):
    """Base exception for NSAI SDK errors"""
    pass


class AuthenticationError(NSAIError):
    """Raised when authentication fails"""
    pass


class RateLimitError(NSAIError):
    """Raised when rate limit is exceeded"""
    pass


class ValidationError(NSAIError):
    """Raised when request validation fails"""
    pass


class ResearchError(NSAIError):
    """Raised when research query fails"""
    pass


class NetworkError(NSAIError):
    """Raised when network request fails"""
    pass


class TimeoutError(NSAIError):
    """Raised when request times out"""
    pass