"""
NSAI Data Client
Main client for interacting with NSAI Data API
"""

import os
import time
import httpx
from typing import Optional, Dict, Any, List
from .models import ResearchQuery, ResearchResponse, ResearchStatus
from .exceptions import NSAIError, AuthenticationError, RateLimitError


class NSAIClient:
    """
    NSAI Data API Client
    
    Example:
        >>> from nsai import NSAIClient
        >>> client = NSAIClient(api_key="your-api-key")
        >>> response = client.research("What are the latest AI developments?")
        >>> print(response.report)
    """
    
    BASE_URL = "https://api.nsai-data.com/v1"
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 300.0,
        max_retries: int = 3
    ):
        """
        Initialize NSAI Data client
        
        Args:
            api_key: Your NSAI Data API key (or set NSAI_API_KEY env var)
            base_url: Optional custom API endpoint
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self.api_key = api_key or os.getenv("NSAI_API_KEY")
        if not self.api_key:
            raise AuthenticationError(
                "API key required. Pass api_key or set NSAI_API_KEY environment variable"
            )
        
        self.base_url = base_url or self.BASE_URL
        self.timeout = timeout
        self.max_retries = max_retries
        
        self._client = httpx.Client(
            base_url=self.base_url,
            timeout=timeout,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "User-Agent": "nsai-python/1.0.0"
            }
        )
    
    def research(
        self,
        query: str,
        output_format: str = "markdown",
        max_sources: int = 10,
        enable_validation: bool = True,
        include_sources: bool = True,
        webhook_url: Optional[str] = None
    ) -> ResearchResponse:
        """
        Create a new research query
        
        Args:
            query: The research question or topic
            output_format: Output format (markdown, json, html)
            max_sources: Maximum number of sources to analyze
            enable_validation: Enable fact-checking and validation
            include_sources: Include source citations in response
            webhook_url: Optional webhook for async notifications
            
        Returns:
            ResearchResponse object containing the report and metadata
            
        Example:
            >>> response = client.research(
            ...     "Compare quantum and classical computing",
            ...     max_sources=20,
            ...     output_format="markdown"
            ... )
            >>> print(f"Report generated in {response.duration_ms}ms")
            >>> print(response.report)
        """
        request = ResearchQuery(
            query=query,
            output_format=output_format,
            max_sources=max_sources,
            enable_validation=enable_validation,
            include_sources=include_sources,
            webhook_url=webhook_url
        )
        
        response = self._make_request(
            "POST",
            "/research/query",
            json=request.dict()
        )
        
        return ResearchResponse(**response)
    
    def get_research_status(self, research_id: str) -> ResearchStatus:
        """
        Get the status of a research query
        
        Args:
            research_id: The ID of the research query
            
        Returns:
            ResearchStatus object
        """
        response = self._make_request(
            "GET",
            f"/research/status/{research_id}"
        )
        
        return ResearchStatus(**response)
    
    def get_research_history(
        self,
        limit: int = 10,
        offset: int = 0,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get research query history
        
        Args:
            limit: Number of results to return
            offset: Pagination offset
            status: Filter by status (pending, processing, completed, failed)
            
        Returns:
            Dictionary containing queries and pagination info
        """
        params = {
            "limit": limit,
            "offset": offset
        }
        if status:
            params["status"] = status
        
        return self._make_request(
            "GET",
            "/research/history",
            params=params
        )
    
    def cancel_research(self, research_id: str) -> Dict[str, str]:
        """
        Cancel a pending or processing research query
        
        Args:
            research_id: The ID of the research query to cancel
            
        Returns:
            Confirmation message
        """
        return self._make_request(
            "POST",
            f"/research/cancel/{research_id}"
        )
    
    def get_usage(self, period: str = "current") -> Dict[str, Any]:
        """
        Get API usage statistics
        
        Args:
            period: Usage period (current, last_month, all_time)
            
        Returns:
            Usage statistics including queries, tokens, and costs
        """
        return self._make_request(
            "GET",
            f"/usage/{period}"
        )
    
    def create_api_key(self, name: str, scopes: List[str] = None) -> Dict[str, Any]:
        """
        Create a new API key
        
        Args:
            name: Name for the API key
            scopes: Optional list of scopes/permissions
            
        Returns:
            New API key details (key is only shown once)
        """
        data = {"name": name}
        if scopes:
            data["scopes"] = scopes
            
        return self._make_request(
            "POST",
            "/api-keys",
            json=data
        )
    
    def list_api_keys(self) -> List[Dict[str, Any]]:
        """List all API keys (excludes the actual key values)"""
        return self._make_request("GET", "/api-keys")
    
    def revoke_api_key(self, key_id: str) -> Dict[str, str]:
        """Revoke an API key"""
        return self._make_request("DELETE", f"/api-keys/{key_id}")
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Any:
        """Make HTTP request with retries and error handling"""
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                response = self._client.request(method, endpoint, **kwargs)
                
                if response.status_code == 429:
                    # Rate limited
                    retry_after = int(response.headers.get("Retry-After", 60))
                    if attempt < self.max_retries - 1:
                        time.sleep(retry_after)
                        continue
                    raise RateLimitError(
                        f"Rate limit exceeded. Retry after {retry_after} seconds"
                    )
                
                response.raise_for_status()
                return response.json()
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    raise AuthenticationError("Invalid API key")
                elif e.response.status_code == 403:
                    raise AuthenticationError("Insufficient permissions")
                elif e.response.status_code >= 500:
                    last_error = e
                    if attempt < self.max_retries - 1:
                        time.sleep(2 ** attempt)  # Exponential backoff
                        continue
                else:
                    raise NSAIError(f"API error: {e.response.text}")
            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
        
        raise NSAIError(f"Request failed after {self.max_retries} attempts: {last_error}")
    
    def close(self):
        """Close the HTTP client"""
        self._client.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()