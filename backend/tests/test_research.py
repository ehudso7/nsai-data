import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime

from backend.main import app
from backend.api.research import ResearchRequest, ResearchResponse
from backend.agents.research_agents import (
    QueryAnalyzer, WebSearchAgent, ContentExtractor,
    InsightGenerator, ReportFormatter, ValidationAgent
)

client = TestClient(app)

@pytest.fixture
def mock_openai():
    """Mock OpenAI client"""
    with patch("backend.integrations.openai_client.OpenAIClient") as mock:
        mock_instance = mock.return_value
        mock_instance.generate.return_value = "Mocked AI response"
        yield mock_instance

@pytest.fixture
def mock_firecrawl():
    """Mock Firecrawl client"""
    with patch("backend.integrations.firecrawl_client.FirecrawlClient") as mock:
        mock_instance = mock.return_value
        mock_instance.scrape.return_value = {
            "content": "Mocked web content",
            "metadata": {"title": "Test Page", "url": "https://example.com"}
        }
        yield mock_instance

@pytest.fixture
def sample_research_request():
    """Sample research request data"""
    return {
        "query": "What are the latest developments in quantum computing?",
        "output_format": "markdown",
        "max_sources": 5,
        "enable_validation": True,
        "include_sources": True
    }

class TestResearchAPI:
    """Test research API endpoints"""
    
    def test_create_research_query_success(self, mock_openai, mock_firecrawl, sample_research_request):
        """Test successful research query creation"""
        response = client.post("/api/v1/research/query", json=sample_research_request)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "research_id" in data
        assert "status" in data
        assert data["status"] == "completed"
        assert "report" in data
        assert "metadata" in data
        assert "duration_ms" in data
    
    def test_create_research_query_invalid_request(self):
        """Test research query with invalid request data"""
        invalid_request = {
            "query": "",  # Empty query
            "output_format": "invalid_format"
        }
        
        response = client.post("/api/v1/research/query", json=invalid_request)
        assert response.status_code == 422
    
    def test_create_research_query_rate_limit(self, sample_research_request):
        """Test rate limiting on research endpoint"""
        # Make multiple requests to trigger rate limit
        for i in range(12):  # Assuming limit is 10 per hour
            response = client.post("/api/v1/research/query", json=sample_research_request)
            
            if i < 10:
                assert response.status_code == 200
            else:
                assert response.status_code == 429  # Too Many Requests
    
    def test_get_research_status(self):
        """Test getting research query status"""
        research_id = "test-research-id"
        response = client.get(f"/api/v1/research/status/{research_id}")
        
        # Should return 404 for non-existent research
        assert response.status_code == 404
    
    def test_get_research_history(self):
        """Test getting research history"""
        response = client.get("/api/v1/research/history?limit=10&offset=0")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "queries" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data

class TestResearchAgents:
    """Test individual research agents"""
    
    @pytest.mark.asyncio
    async def test_query_analyzer(self, mock_openai):
        """Test QueryAnalyzer agent"""
        analyzer = QueryAnalyzer(mock_openai)
        
        result = await analyzer.process({
            "query": "What is artificial intelligence?"
        })
        
        assert result["status"] == "success"
        assert "analysis" in result
        assert "search_queries" in result
        assert "key_concepts" in result
    
    @pytest.mark.asyncio
    async def test_web_search_agent(self, mock_openai):
        """Test WebSearchAgent"""
        search_agent = WebSearchAgent(mock_openai)
        
        with patch("backend.agents.research_agents.search_web") as mock_search:
            mock_search.return_value = [
                {
                    "title": "Test Result",
                    "url": "https://example.com",
                    "snippet": "Test snippet"
                }
            ]
            
            result = await search_agent.process({
                "search_queries": ["artificial intelligence"],
                "max_results": 5
            })
            
            assert result["status"] == "success"
            assert "sources" in result
            assert len(result["sources"]) > 0
    
    @pytest.mark.asyncio
    async def test_content_extractor(self, mock_openai, mock_firecrawl):
        """Test ContentExtractor agent"""
        extractor = ContentExtractor(mock_openai, mock_firecrawl)
        
        result = await extractor.process({
            "sources": [
                {"url": "https://example.com", "title": "Test"}
            ]
        })
        
        assert result["status"] == "success"
        assert "extracted_content" in result
        assert len(result["extracted_content"]) > 0
    
    @pytest.mark.asyncio
    async def test_insight_generator(self, mock_openai):
        """Test InsightGenerator agent"""
        generator = InsightGenerator(mock_openai)
        
        result = await generator.process({
            "query": "AI applications",
            "extracted_content": [
                {
                    "url": "https://example.com",
                    "content": "AI is transforming industries...",
                    "key_points": ["automation", "efficiency"]
                }
            ]
        })
        
        assert result["status"] == "success"
        assert "insights" in result
        assert "synthesis" in result
        assert "key_findings" in result
    
    @pytest.mark.asyncio
    async def test_report_formatter(self, mock_openai):
        """Test ReportFormatter agent"""
        formatter = ReportFormatter(mock_openai)
        
        result = await formatter.process({
            "query": "AI research",
            "insights": {
                "key_findings": ["Finding 1", "Finding 2"],
                "synthesis": "Overall synthesis"
            },
            "sources": [{"url": "https://example.com", "title": "Source"}],
            "output_format": "markdown"
        })
        
        assert result["status"] == "success"
        assert "report" in result
        assert "format" in result
        assert result["format"] == "markdown"
    
    @pytest.mark.asyncio
    async def test_validation_agent(self, mock_openai):
        """Test ValidationAgent"""
        validator = ValidationAgent(mock_openai)
        
        result = await validator.process({
            "report": "# AI Report\n\nContent here...",
            "sources": [{"url": "https://example.com"}],
            "insights": {"key_findings": ["Finding 1"]}
        })
        
        assert result["status"] == "success"
        assert "validation" in result
        assert "confidence_score" in result["validation"]
        assert "fact_checks" in result["validation"]

class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_register_user(self):
        """Test user registration"""
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "Test1234!",
            "full_name": "Test User"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["username"] == user_data["username"]
        assert "id" in data
        assert "created_at" in data
    
    def test_login_user(self):
        """Test user login"""
        login_data = {
            "username": "demo",
            "password": "demo1234"
        }
        
        response = client.post(
            "/api/v1/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        login_data = {
            "username": "invalid",
            "password": "wrong"
        }
        
        response = client.post(
            "/api/v1/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
    
    def test_refresh_token(self):
        """Test token refresh"""
        # First login to get tokens
        login_response = client.post(
            "/api/v1/auth/login",
            data={"username": "demo", "password": "demo1234"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        refresh_token = login_response.json()["refresh_token"]
        
        # Use refresh token
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    def test_protected_endpoint(self):
        """Test accessing protected endpoint"""
        # Without token
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 403  # Forbidden
        
        # With valid token
        login_response = client.post(
            "/api/v1/auth/login",
            data={"username": "demo", "password": "demo1234"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        token = login_response.json()["access_token"]
        
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data

class TestIntegrations:
    """Test external integrations"""
    
    @pytest.mark.asyncio
    async def test_openai_integration(self):
        """Test OpenAI client integration"""
        from backend.integrations.openai_client import OpenAIClient
        
        with patch("openai.ChatCompletion.create") as mock_create:
            mock_create.return_value = {
                "choices": [{
                    "message": {"content": "Test response"}
                }]
            }
            
            client = OpenAIClient("test-key")
            response = await client.generate("Test prompt")
            
            assert response == "Test response"
            mock_create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_firecrawl_integration(self):
        """Test Firecrawl client integration"""
        from backend.integrations.firecrawl_client import FirecrawlClient
        
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "data": {
                    "content": "Scraped content",
                    "metadata": {"title": "Page Title"}
                }
            }
            
            client = FirecrawlClient("test-key")
            result = await client.scrape("https://example.com")
            
            assert result["content"] == "Scraped content"
            assert result["metadata"]["title"] == "Page Title"

class TestUtilities:
    """Test utility functions"""
    
    def test_rate_limiter(self):
        """Test rate limiting decorator"""
        from backend.core.rate_limiter import RateLimiter
        
        limiter = RateLimiter(calls=2, period=1)
        
        @limiter.limit
        def test_func():
            return "success"
        
        # First two calls should succeed
        assert test_func() == "success"
        assert test_func() == "success"
        
        # Third call should be rate limited
        with pytest.raises(Exception):
            test_func()
    
    def test_error_handling(self):
        """Test global error handling"""
        # Test 404
        response = client.get("/nonexistent")
        assert response.status_code == 404
        
        # Test validation error
        response = client.post("/api/v1/research/query", json={})
        assert response.status_code == 422
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data

if __name__ == "__main__":
    pytest.main([__file__, "-v"])