"""
Research API endpoints for NSAI Data
"""

import asyncio
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.agents.research_agents import (
    QueryAnalyzerAgent,
    WebSearchAgent,
    ContentExtractorAgent,
    InsightGeneratorAgent,
    ReportFormatterAgent,
    ValidationAgent
)
from backend.agents.base import AgentOrchestrator
from backend.core.logging import get_logger, log_research_query
from backend.core.exceptions import ResearchError, ValidationError
from backend.core.auth import get_current_user
from backend.core.rate_limiter import rate_limit


logger = get_logger(__name__)
router = APIRouter()


class ResearchRequest(BaseModel):
    """Research request model"""
    query: str = Field(..., min_length=10, max_length=1000, description="Research query")
    output_format: str = Field(default="markdown", pattern="^(markdown|json|html)$")
    include_sources: bool = Field(default=True, description="Include source citations")
    max_sources: int = Field(default=10, ge=1, le=50, description="Maximum sources to analyze")
    enable_validation: bool = Field(default=True, description="Enable result validation")
    stream_response: bool = Field(default=False, description="Stream the response")


class ResearchResponse(BaseModel):
    """Research response model"""
    id: str = Field(..., description="Research query ID")
    query: str = Field(..., description="Original query")
    report: str = Field(..., description="Generated report")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    duration_ms: float = Field(..., description="Processing duration in milliseconds")
    success: bool = Field(default=True)
    error: Optional[str] = Field(default=None)


class ResearchStatus(BaseModel):
    """Research status model"""
    id: str
    status: str
    progress: int
    message: str
    created_at: datetime
    updated_at: datetime


# In-memory storage for research queries (replace with database in production)
research_storage: Dict[str, Dict[str, Any]] = {}


@router.post("/query", response_model=ResearchResponse)
@rate_limit(calls=10, period=3600)
async def create_research_query(
    request: ResearchRequest,
    background_tasks: BackgroundTasks,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    """
    Create a new research query
    
    This endpoint initiates an autonomous research process that:
    1. Analyzes the query
    2. Searches for relevant information
    3. Extracts and processes content
    4. Generates insights
    5. Formats a professional report
    """
    research_id = str(uuid4())
    start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info(f"Starting research query: {research_id}")
        
        # Store initial status
        research_storage[research_id] = {
            "id": research_id,
            "status": "processing",
            "progress": 0,
            "query": request.query,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "user_id": current_user.get("id") if current_user else "anonymous"
        }
        
        # If streaming is requested, handle it differently
        if request.stream_response:
            return StreamingResponse(
                stream_research(research_id, request),
                media_type="text/event-stream"
            )
        
        # Execute research synchronously for non-streaming requests
        result = await execute_research(research_id, request)
        
        # Log the query
        duration_ms = (asyncio.get_event_loop().time() - start_time) * 1000
        log_research_query(
            query=request.query,
            user_id=current_user.get("id") if current_user else "anonymous",
            duration_ms=duration_ms,
            success=result.get("success", False)
        )
        
        return ResearchResponse(
            id=research_id,
            query=request.query,
            report=result.get("report", ""),
            metadata=result.get("metadata", {}),
            duration_ms=duration_ms,
            success=result.get("success", False),
            error=result.get("error")
        )
        
    except Exception as e:
        logger.error(f"Research query failed: {e}", exc_info=True)
        
        duration_ms = (asyncio.get_event_loop().time() - start_time) * 1000
        
        return ResearchResponse(
            id=research_id,
            query=request.query,
            report="",
            metadata={},
            duration_ms=duration_ms,
            success=False,
            error=str(e)
        )


async def execute_research(research_id: str, request: ResearchRequest) -> Dict[str, Any]:
    """Execute the research workflow"""
    try:
        # Update status
        update_research_status(research_id, "analyzing", 10, "Analyzing query...")
        
        # Initialize agents
        orchestrator = AgentOrchestrator("research_orchestrator")
        
        # Phase 1: Query Analysis
        query_analyzer = QueryAnalyzerAgent()
        analysis_result = await query_analyzer.execute(request.query)
        
        if not analysis_result.success:
            raise ResearchError(f"Query analysis failed: {analysis_result.error}")
        
        update_research_status(research_id, "searching", 25, "Searching for information...")
        
        # Phase 2: Web Search
        web_search = WebSearchAgent()
        search_result = await web_search.execute(analysis_result.data)
        
        if not search_result.success:
            raise ResearchError(f"Web search failed: {search_result.error}")
        
        update_research_status(research_id, "extracting", 40, "Extracting content...")
        
        # Phase 3: Content Extraction
        content_extractor = ContentExtractorAgent()
        extraction_result = await content_extractor.execute(search_result.data[:request.max_sources])
        
        if not extraction_result.success:
            raise ResearchError(f"Content extraction failed: {extraction_result.error}")
        
        update_research_status(research_id, "analyzing", 60, "Generating insights...")
        
        # Phase 4: Insight Generation
        insight_generator = InsightGeneratorAgent()
        insight_result = await insight_generator.execute({
            "content": extraction_result.data,
            "analysis_params": analysis_result.data
        })
        
        if not insight_result.success:
            raise ResearchError(f"Insight generation failed: {insight_result.error}")
        
        update_research_status(research_id, "formatting", 80, "Formatting report...")
        
        # Phase 5: Report Formatting
        report_formatter = ReportFormatterAgent()
        format_result = await report_formatter.execute({
            "insights": insight_result.data,
            "metadata": {
                "query": request.query,
                "sources": extraction_result.data if request.include_sources else []
            }
        })
        
        if not format_result.success:
            raise ResearchError(f"Report formatting failed: {format_result.error}")
        
        # Phase 6: Validation (if enabled)
        final_report = format_result.data
        validation_data = {}
        
        if request.enable_validation:
            update_research_status(research_id, "validating", 95, "Validating results...")
            
            validator = ValidationAgent()
            validation_result = await validator.execute({
                "report": final_report,
                "sources": extraction_result.data
            })
            
            if validation_result.success:
                validation_data = validation_result.data
                final_report = validation_result.data.get("report", final_report)
        
        update_research_status(research_id, "completed", 100, "Research completed")
        
        # Prepare metadata
        metadata = {
            "analysis": analysis_result.data,
            "sources_found": len(search_result.data),
            "sources_analyzed": len(extraction_result.data),
            "validation": validation_data,
            "agents_used": [
                "QueryAnalyzer",
                "WebSearch",
                "ContentExtractor",
                "InsightGenerator",
                "ReportFormatter"
            ]
        }
        
        if request.enable_validation:
            metadata["agents_used"].append("Validation")
        
        return {
            "success": True,
            "report": final_report,
            "metadata": metadata
        }
        
    except Exception as e:
        logger.error(f"Research execution failed: {e}", exc_info=True)
        update_research_status(research_id, "failed", 0, str(e))
        return {
            "success": False,
            "report": "",
            "metadata": {},
            "error": str(e)
        }


def update_research_status(research_id: str, status: str, progress: int, message: str):
    """Update research status in storage"""
    if research_id in research_storage:
        research_storage[research_id].update({
            "status": status,
            "progress": progress,
            "message": message,
            "updated_at": datetime.utcnow()
        })


async def stream_research(research_id: str, request: ResearchRequest):
    """Stream research progress and results"""
    try:
        # Send initial status
        yield f"data: {{'id': '{research_id}', 'status': 'started', 'progress': 0}}\n\n"
        
        # Execute research with progress updates
        result = await execute_research(research_id, request)
        
        # Send final result
        yield f"data: {{'id': '{research_id}', 'status': 'completed', 'progress': 100, 'result': {result}}}\n\n"
        
    except Exception as e:
        yield f"data: {{'id': '{research_id}', 'status': 'error', 'error': '{str(e)}'}}\n\n"


@router.get("/status/{research_id}", response_model=ResearchStatus)
async def get_research_status(research_id: str):
    """Get the status of a research query"""
    if research_id not in research_storage:
        raise ResourceNotFoundError("Research query", research_id)
    
    data = research_storage[research_id]
    
    return ResearchStatus(
        id=data["id"],
        status=data["status"],
        progress=data.get("progress", 0),
        message=data.get("message", ""),
        created_at=data["created_at"],
        updated_at=data["updated_at"]
    )


@router.get("/history")
async def get_research_history(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get research history for the current user"""
    user_id = current_user.get("id")
    
    # Filter research by user
    user_research = [
        r for r in research_storage.values()
        if r.get("user_id") == user_id
    ]
    
    # Sort by created_at descending
    user_research.sort(key=lambda x: x["created_at"], reverse=True)
    
    # Apply pagination
    paginated = user_research[offset:offset + limit]
    
    return {
        "total": len(user_research),
        "limit": limit,
        "offset": offset,
        "items": paginated
    }