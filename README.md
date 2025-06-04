# NSAI Data - Enterprise Autonomous Research Platform

[![Deploy Status](https://github.com/ehudso7/nsai-data/workflows/Deploy%20NSAI%20Data/badge.svg)](https://github.com/ehudso7/nsai-data/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)

Transform complex questions into comprehensive research reports in seconds with AI-powered autonomous agents.

## 🚀 Features

- **Autonomous Research Agents**: Multi-agent system that analyzes queries, searches the web, extracts content, generates insights, and formats professional reports
- **Enterprise-Grade Architecture**: Built with FastAPI, featuring rate limiting, comprehensive error handling, and structured logging
- **Web Scraping at Scale**: Integrated Firecrawl with fallback mechanisms for reliable data extraction
- **AI-Powered Analysis**: GPT-4 Turbo integration for intelligent query understanding and insight generation
- **Plugin System**: WASI-based plugin architecture for extending functionality
- **Real-time Progress**: WebSocket support for streaming research progress
- **Professional UI**: Responsive Tailwind CSS interface with live updates
- **Production Ready**: Docker deployment, CI/CD pipeline, monitoring, and security best practices

## 📋 Prerequisites

- Python 3.11+
- Docker & Docker Compose
- OpenAI API Key
- (Optional) Firecrawl API Key
- (Optional) Stripe API Keys for billing
- (Optional) SendGrid API Key for emails

## 🛠️ Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/ehudso7/nsai-data.git
cd nsai-data
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 3. Run with Docker Compose
```bash
docker-compose up -d
```

### 4. Access the application
- Web UI: http://localhost
- API Docs: http://localhost:8000/docs
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## 🏗️ Architecture

```
NSAI Data Architecture
├── Frontend (Tailwind CSS + Alpine.js)
│   └── Responsive Research Interface
├── Backend (FastAPI)
│   ├── Multi-Agent System
│   │   ├── Query Analyzer
│   │   ├── Web Search Agent
│   │   ├── Content Extractor
│   │   ├── Insight Generator
│   │   ├── Report Formatter
│   │   └── Validation Agent
│   ├── Integrations
│   │   ├── OpenAI GPT-4
│   │   ├── Firecrawl
│   │   ├── Stripe
│   │   └── SendGrid
│   └── Core Systems
│       ├── Authentication
│       ├── Rate Limiting
│       ├── Caching (Redis)
│       └── Monitoring
└── Infrastructure
    ├── Docker Containers
    ├── PostgreSQL
    ├── Redis
    └── Nginx
```

## 🔧 Development Setup

### Local Development
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python -m uvicorn backend.main:app --reload
```

### Running Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html

# Run specific test file
pytest backend/tests/test_research.py
```

### Code Quality
```bash
# Format code
black backend

# Lint code
flake8 backend

# Type checking
mypy backend
```

## 📚 API Documentation

### Core Endpoints

#### Create Research Query
```http
POST /api/v1/research/query
Content-Type: application/json

{
  "query": "What are the latest developments in quantum computing?",
  "output_format": "markdown",
  "max_sources": 10,
  "enable_validation": true
}
```

#### Get Research Status
```http
GET /api/v1/research/status/{research_id}
```

#### Get Research History
```http
GET /api/v1/research/history?limit=10&offset=0
```

## 🔐 Security Features

- **Authentication**: JWT-based authentication system
- **Rate Limiting**: Configurable per-endpoint rate limits
- **Input Validation**: Comprehensive request validation
- **HTTPS**: SSL/TLS encryption in production
- **CORS**: Configurable CORS policies
- **Security Headers**: OWASP recommended headers
- **API Keys**: Secure API key management
- **Monitoring**: Real-time security event monitoring

## 📊 Performance Optimization

- **Caching**: Redis-based caching for frequent queries
- **Async Processing**: Non-blocking I/O for all external calls
- **Connection Pooling**: Optimized database connections
- **Load Balancing**: Nginx reverse proxy configuration
- **Resource Limits**: Container resource management
- **Query Optimization**: Indexed database queries

## 🚀 Deployment

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway up
```

### Manual Deployment
```bash
# Build Docker image
docker build -t nsai-data:latest .

# Run with environment file
docker run -d \
  --name nsai-data \
  -p 8000:8000 \
  --env-file .env \
  nsai-data:latest
```

## 📈 Monitoring & Observability

- **Prometheus Metrics**: http://localhost:9090
- **Grafana Dashboards**: http://localhost:3000
- **Structured Logging**: JSON formatted logs
- **Health Checks**: `/health` endpoint
- **Performance Metrics**: Request duration, throughput
- **Error Tracking**: Sentry integration (optional)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Firecrawl for web scraping capabilities
- FastAPI community for the excellent framework
- All contributors and testers

## 📞 Support

- Documentation: [docs.nsaidata.com](https://docs.nsaidata.com)
- Issues: [GitHub Issues](https://github.com/ehudso7/nsai-data/issues)
- Email: support@nsaidata.com

---

Built with ❤️ by Everton Hudson | [nsaidata.com](https://nsaidata.com)