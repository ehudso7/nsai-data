"""
NSAI Data Models
Data models for API requests and responses
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator


class ResearchQuery(BaseModel):
    """Research query request model"""
    query: str = Field(..., description="The research question or topic")
    output_format: str = Field("markdown", description="Output format: markdown, json, html")
    max_sources: int = Field(10, ge=1, le=50, description="Maximum sources to analyze")
    enable_validation: bool = Field(True, description="Enable fact-checking")
    include_sources: bool = Field(True, description="Include source citations")
    webhook_url: Optional[str] = Field(None, description="Webhook URL for async notifications")
    
    @validator("output_format")
    def validate_format(cls, v):
        allowed = ["markdown", "json", "html"]
        if v not in allowed:
            raise ValueError(f"output_format must be one of {allowed}")
        return v


class ResearchResponse(BaseModel):
    """Research query response model"""
    research_id: str
    status: str
    report: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    sources: Optional[List[Dict[str, str]]] = None
    duration_ms: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    
    @property
    def is_complete(self) -> bool:
        """Check if research is complete"""
        return self.status == "completed"
    
    @property
    def is_failed(self) -> bool:
        """Check if research failed"""
        return self.status == "failed"
    
    @property
    def confidence_score(self) -> Optional[float]:
        """Get confidence score if validation was enabled"""
        if self.metadata and "validation" in self.metadata:
            return self.metadata["validation"].get("confidence_score")
        return None


class ResearchStatus(BaseModel):
    """Research status model"""
    research_id: str
    status: str  # pending, processing, completed, failed
    progress: Optional[int] = Field(None, ge=0, le=100)
    current_step: Optional[str] = None
    estimated_completion: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class UsageStats(BaseModel):
    """API usage statistics"""
    period: str
    queries_count: int
    tokens_used: int
    sources_analyzed: int
    cost_usd: float
    remaining_quota: Optional[int] = None
    reset_at: Optional[datetime] = None


class APIKey(BaseModel):
    """API key model"""
    id: str
    name: str
    prefix: str  # First 8 characters for identification
    created_at: datetime
    last_used: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    scopes: List[str] = Field(default_factory=list)
    is_active: bool = True