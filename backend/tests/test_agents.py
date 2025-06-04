import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from backend.agents.base import BaseAgent, AgentResult
from backend.agents.research_agents import (
    QueryAnalyzer, WebSearchAgent, ContentExtractor,
    InsightGenerator, ReportFormatter, ValidationAgent
)

@pytest.mark.unit
@pytest.mark.agents
class TestBaseAgent:
    """Test base agent functionality"""
    
    @pytest.mark.asyncio
    async def test_base_agent_timeout(self):
        """Test agent timeout handling"""
        class SlowAgent(BaseAgent):
            async def _process(self, data):
                await asyncio.sleep(5)  # Longer than timeout
                return {"result": "too late"}
        
        agent = SlowAgent(Mock(), timeout=1)
        result = await agent.process({})
        
        assert result["status"] == "error"
        assert "timeout" in result["error"].lower()
    
    @pytest.mark.asyncio
    async def test_base_agent_error_handling(self):
        """Test agent error handling"""
        class ErrorAgent(BaseAgent):
            async def _process(self, data):
                raise ValueError("Test error")
        
        agent = ErrorAgent(Mock())
        result = await agent.process({})
        
        assert result["status"] == "error"
        assert "Test error" in result["error"]
    
    @pytest.mark.asyncio
    async def test_base_agent_retry(self):
        """Test agent retry mechanism"""
        class RetryAgent(BaseAgent):
            attempt = 0
            
            async def _process(self, data):
                self.attempt += 1
                if self.attempt < 3:
                    raise ConnectionError("Network error")
                return {"result": "success"}
        
        agent = RetryAgent(Mock(), max_retries=3)
        result = await agent.process({})
        
        assert result["status"] == "success"
        assert agent.attempt == 3

@pytest.mark.unit
@pytest.mark.agents
class TestQueryAnalyzer:
    """Test QueryAnalyzer agent"""
    
    @pytest.mark.asyncio
    async def test_analyze_simple_query(self, mock_openai_client):
        """Test analyzing a simple query"""
        mock_openai_client.generate.return_value = """
        {
            "intent": "research",
            "topics": ["artificial intelligence", "applications"],
            "search_queries": [
                "AI applications 2024",
                "artificial intelligence use cases"
            ],
            "key_concepts": ["machine learning", "automation"],
            "complexity": "medium"
        }
        """
        
        analyzer = QueryAnalyzer(mock_openai_client)
        result = await analyzer.process({
            "query": "What are the applications of AI?"
        })
        
        assert result["status"] == "success"
        assert "analysis" in result
        assert "search_queries" in result
        assert len(result["search_queries"]) > 0
        assert "key_concepts" in result
    
    @pytest.mark.asyncio
    async def test_analyze_complex_query(self, mock_openai_client):
        """Test analyzing a complex multi-part query"""
        mock_openai_client.generate.return_value = """
        {
            "intent": "comparative_analysis",
            "topics": ["quantum computing", "classical computing", "performance"],
            "search_queries": [
                "quantum vs classical computing 2024",
                "quantum computing advantages",
                "quantum supremacy benchmarks"
            ],
            "key_concepts": ["qubits", "superposition", "entanglement"],
            "complexity": "high",
            "subtopics": ["algorithms", "hardware", "applications"]
        }
        """
        
        analyzer = QueryAnalyzer(mock_openai_client)
        result = await analyzer.process({
            "query": "Compare quantum and classical computing performance"
        })
        
        assert result["status"] == "success"
        assert result["analysis"]["complexity"] == "high"
        assert "subtopics" in result["analysis"]

@pytest.mark.integration
@pytest.mark.agents
class TestWebSearchAgent:
    """Test WebSearchAgent"""
    
    @pytest.mark.asyncio
    async def test_web_search_success(self, mock_openai_client):
        """Test successful web search"""
        with patch("backend.agents.research_agents.search_web") as mock_search:
            mock_search.return_value = [
                {
                    "title": "AI Revolution 2024",
                    "url": "https://example.com/ai-revolution",
                    "snippet": "Latest developments in artificial intelligence..."
                },
                {
                    "title": "Machine Learning Advances",
                    "url": "https://example.com/ml-advances",
                    "snippet": "New breakthroughs in deep learning..."
                }
            ]
            
            agent = WebSearchAgent(mock_openai_client)
            result = await agent.process({
                "search_queries": ["AI developments 2024"],
                "max_results": 5
            })
            
            assert result["status"] == "success"
            assert "sources" in result
            assert len(result["sources"]) == 2
            assert all("relevance_score" in s for s in result["sources"])
    
    @pytest.mark.asyncio
    async def test_web_search_filtering(self, mock_openai_client):
        """Test web search with domain filtering"""
        mock_openai_client.generate.return_value = "8"  # Relevance score
        
        with patch("backend.agents.research_agents.search_web") as mock_search:
            mock_search.return_value = [
                {
                    "title": "Academic Paper",
                    "url": "https://arxiv.org/paper",
                    "snippet": "Research paper on AI"
                },
                {
                    "title": "Blog Post",
                    "url": "https://medium.com/ai-post",
                    "snippet": "Opinion piece on AI"
                }
            ]
            
            agent = WebSearchAgent(mock_openai_client)
            result = await agent.process({
                "search_queries": ["AI research"],
                "max_results": 10,
                "allowed_domains": ["arxiv.org"]
            })
            
            assert result["status"] == "success"
            # Should filter out non-allowed domains
            assert len([s for s in result["sources"] 
                       if "arxiv.org" in s["url"]]) > 0

@pytest.mark.integration
@pytest.mark.agents
class TestContentExtractor:
    """Test ContentExtractor agent"""
    
    @pytest.mark.asyncio
    async def test_extract_with_firecrawl(self, mock_openai_client, mock_firecrawl_client):
        """Test content extraction using Firecrawl"""
        mock_firecrawl_client.scrape.return_value = {
            "content": "This is a comprehensive article about AI...",
            "metadata": {
                "title": "AI Article",
                "author": "John Doe",
                "published_date": "2024-01-01"
            }
        }
        
        mock_openai_client.generate.return_value = """
        - AI is transforming industries
        - Machine learning enables pattern recognition
        - Deep learning mimics human brain
        """
        
        extractor = ContentExtractor(mock_openai_client, mock_firecrawl_client)
        result = await extractor.process({
            "sources": [
                {"url": "https://example.com/ai-article", "title": "AI Article"}
            ]
        })
        
        assert result["status"] == "success"
        assert "extracted_content" in result
        assert len(result["extracted_content"]) == 1
        assert "key_points" in result["extracted_content"][0]
        assert "metadata" in result["extracted_content"][0]
    
    @pytest.mark.asyncio
    async def test_extract_fallback_scraping(self, mock_openai_client):
        """Test fallback to direct scraping when Firecrawl fails"""
        # Mock Firecrawl client that fails
        mock_firecrawl = Mock()
        mock_firecrawl.scrape.side_effect = Exception("API error")
        
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = Mock()
            mock_response.text = "<html><body>Fallback content about AI</body></html>"
            mock_response.raise_for_status = Mock()
            mock_get.return_value = mock_response
            
            mock_openai_client.generate.return_value = "- Fallback extraction worked"
            
            extractor = ContentExtractor(mock_openai_client, mock_firecrawl)
            result = await extractor.process({
                "sources": [{"url": "https://example.com/test"}]
            })
            
            assert result["status"] == "success"
            assert len(result["extracted_content"]) == 1

@pytest.mark.unit
@pytest.mark.agents
class TestInsightGenerator:
    """Test InsightGenerator agent"""
    
    @pytest.mark.asyncio
    async def test_generate_insights(self, mock_openai_client):
        """Test insight generation from extracted content"""
        mock_openai_client.generate.return_value = """
        {
            "key_findings": [
                "AI adoption increased by 50% in 2024",
                "Healthcare sector leads in AI implementation",
                "Ethical concerns remain a major challenge"
            ],
            "trends": [
                "Shift towards explainable AI",
                "Increased focus on AI safety"
            ],
            "implications": {
                "business": "Companies need AI strategy",
                "society": "Workforce retraining essential"
            },
            "synthesis": "AI is rapidly transforming industries with healthcare leading adoption..."
        }
        """
        
        generator = InsightGenerator(mock_openai_client)
        result = await generator.process({
            "query": "AI industry trends",
            "extracted_content": [
                {
                    "content": "AI adoption statistics...",
                    "key_points": ["50% growth", "Healthcare focus"]
                }
            ]
        })
        
        assert result["status"] == "success"
        assert "insights" in result
        assert "key_findings" in result["insights"]
        assert "synthesis" in result
        assert len(result["insights"]["key_findings"]) == 3

@pytest.mark.unit
@pytest.mark.agents
class TestReportFormatter:
    """Test ReportFormatter agent"""
    
    @pytest.mark.asyncio
    async def test_format_markdown_report(self, mock_openai_client):
        """Test formatting report in markdown"""
        mock_openai_client.generate.return_value = """# AI Industry Report

## Executive Summary
AI adoption has increased significantly in 2024...

## Key Findings
1. 50% increase in adoption
2. Healthcare leads implementation

## Sources
- [Source 1](https://example.com)
"""
        
        formatter = ReportFormatter(mock_openai_client)
        result = await formatter.process({
            "query": "AI trends",
            "insights": {
                "key_findings": ["50% increase", "Healthcare leads"],
                "synthesis": "AI is transforming..."
            },
            "sources": [{"url": "https://example.com", "title": "Source 1"}],
            "output_format": "markdown"
        })
        
        assert result["status"] == "success"
        assert "report" in result
        assert result["format"] == "markdown"
        assert "# AI Industry Report" in result["report"]
        assert "## Key Findings" in result["report"]
    
    @pytest.mark.asyncio
    async def test_format_json_report(self, mock_openai_client):
        """Test formatting report in JSON"""
        formatter = ReportFormatter(mock_openai_client)
        result = await formatter.process({
            "query": "AI trends",
            "insights": {"key_findings": ["Finding 1"]},
            "sources": [{"url": "https://example.com"}],
            "output_format": "json"
        })
        
        assert result["status"] == "success"
        assert result["format"] == "json"
        assert isinstance(result["report"], dict)

@pytest.mark.unit
@pytest.mark.agents
class TestValidationAgent:
    """Test ValidationAgent"""
    
    @pytest.mark.asyncio
    async def test_validate_report(self, mock_openai_client):
        """Test report validation"""
        mock_openai_client.generate.return_value = """
        {
            "confidence_score": 92,
            "fact_checks": [
                {
                    "claim": "AI adoption increased 50%",
                    "verified": true,
                    "source_support": "strong",
                    "confidence": 95
                },
                {
                    "claim": "Healthcare leads adoption",
                    "verified": true,
                    "source_support": "moderate",
                    "confidence": 88
                }
            ],
            "consistency_check": {
                "internal_consistency": true,
                "source_alignment": true
            },
            "completeness": {
                "query_addressed": true,
                "missing_aspects": []
            },
            "recommendations": [
                "Consider adding more recent data",
                "Include regional breakdown"
            ]
        }
        """
        
        validator = ValidationAgent(mock_openai_client)
        result = await validator.process({
            "report": "# Report\nAI adoption increased 50%...",
            "sources": [{"url": "https://example.com"}],
            "insights": {"key_findings": ["50% increase"]}
        })
        
        assert result["status"] == "success"
        assert "validation" in result
        assert result["validation"]["confidence_score"] == 92
        assert len(result["validation"]["fact_checks"]) == 2
        assert all(fc["verified"] for fc in result["validation"]["fact_checks"])