import pytest
import asyncio
import os
from typing import Generator, AsyncGenerator
from unittest.mock import Mock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient

# Set test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["OPENAI_API_KEY"] = "test-key"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["API_KEY_SALT"] = "test-salt"

from backend.main import app
from backend.auth.models import Base

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a test database session"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    """Create a test client"""
    with TestClient(app) as c:
        yield c

@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for tests"""
    with patch("backend.integrations.openai_client.OpenAIClient") as mock:
        instance = mock.return_value
        instance.generate = Mock(return_value="Mocked AI response")
        instance.generate_async = Mock(return_value=asyncio.coroutine(lambda: "Mocked AI response")())
        yield instance

@pytest.fixture
def mock_firecrawl_client():
    """Mock Firecrawl client for tests"""
    with patch("backend.integrations.firecrawl_client.FirecrawlClient") as mock:
        instance = mock.return_value
        instance.scrape = Mock(return_value={
            "content": "Mocked web content",
            "metadata": {
                "title": "Test Page",
                "url": "https://example.com",
                "description": "Test description"
            }
        })
        yield instance

@pytest.fixture
def auth_headers():
    """Generate authentication headers for testing"""
    from backend.auth.security import SecurityService
    
    access_token = SecurityService.create_access_token(
        subject="test-user-id",
        scopes=["read", "write"]
    )
    
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture
def sample_user():
    """Create a sample user for testing"""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "is_active": True,
        "is_verified": True
    }

@pytest.fixture
async def async_client():
    """Create an async test client"""
    from httpx import AsyncClient
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )

# Event loop configuration for async tests
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Mock external services
@pytest.fixture(autouse=True)
def mock_external_services():
    """Automatically mock external services for all tests"""
    with patch("backend.integrations.openai_client.openai") as mock_openai:
        with patch("httpx.AsyncClient") as mock_httpx:
            # Configure default responses
            mock_openai.ChatCompletion.create.return_value = {
                "choices": [{"message": {"content": "Test response"}}]
            }
            
            mock_httpx.return_value.__aenter__.return_value.post.return_value.json.return_value = {
                "data": {"content": "Test content"}
            }
            
            yield

# Test data fixtures
@pytest.fixture
def research_query_data():
    """Sample research query data"""
    return {
        "query": "What are the latest developments in quantum computing?",
        "output_format": "markdown",
        "max_sources": 10,
        "enable_validation": True,
        "include_sources": True
    }

@pytest.fixture
def mock_research_response():
    """Mock research response data"""
    return {
        "research_id": "test-id",
        "status": "completed",
        "report": "# Quantum Computing Report\n\nTest content...",
        "metadata": {
            "sources_analyzed": 5,
            "agents_used": ["QueryAnalyzer", "WebSearchAgent"],
            "validation": {
                "confidence_score": 95,
                "fact_checks": [
                    {"claim": "Test claim", "verified": True}
                ]
            }
        },
        "duration_ms": 1500,
        "created_at": "2025-01-01T00:00:00Z"
    }

# Helper functions
def create_test_user(db: Session, **kwargs):
    """Helper to create a test user"""
    from backend.auth.models import User
    from backend.auth.security import SecurityService
    
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "hashed_password": SecurityService.get_password_hash("Test1234!"),
        "full_name": "Test User",
        "is_active": True,
        "is_verified": False
    }
    user_data.update(kwargs)
    
    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def create_test_api_key(db: Session, user_id: str, **kwargs):
    """Helper to create a test API key"""
    from backend.auth.models import APIKey
    from backend.auth.security import SecurityService
    
    api_key, key_hash = SecurityService.generate_api_key()
    
    key_data = {
        "user_id": user_id,
        "name": "Test API Key",
        "key_hash": key_hash,
        "prefix": api_key[:8],
        "is_active": True,
        "scopes": '["read", "write"]'
    }
    key_data.update(kwargs)
    
    api_key_obj = APIKey(**key_data)
    db.add(api_key_obj)
    db.commit()
    db.refresh(api_key_obj)
    
    return api_key, api_key_obj