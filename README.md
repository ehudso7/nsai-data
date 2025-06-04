# NSAI Data - Enterprise Autonomous Research Platform

[![API Status](https://status.nsaidata.com/api/badge/status)](https://status.nsaidata.com)
[![Python SDK](https://img.shields.io/pypi/v/nsai?label=Python%20SDK)](https://pypi.org/project/nsai/)
[![npm version](https://img.shields.io/npm/v/nsai-sdk?label=JS%20SDK)](https://www.npmjs.com/package/nsai-sdk)
[![Documentation](https://img.shields.io/badge/docs-latest-blue)](https://docs.nsaidata.com)
[![License](https://img.shields.io/badge/license-Commercial-red)](LICENSE)
[![SOC2](https://img.shields.io/badge/SOC2-Compliant-green)](https://nsaidata.com/security)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-green)](openapi.yaml)

Transform complex questions into comprehensive research reports in seconds with AI-powered autonomous agents.

🌐 **Access NSAI Data at: [https://nsaidata.com](https://nsaidata.com)**

## 🚀 What is NSAI Data?

NSAI Data is an enterprise-grade SaaS platform that revolutionizes research through autonomous AI agents. Simply ask a question, and our multi-agent system will:

- 🔍 Analyze your query and develop search strategies
- 🌐 Search and discover relevant sources across the web
- 📊 Extract and process information intelligently
- 💡 Generate insights and synthesize findings
- 📄 Create professional, fact-checked reports

All in seconds, not hours.

## 💻 Quick Start

### Installation

**Python:**
```bash
pip install nsai
```

**JavaScript/TypeScript:**
```bash
npm install nsai-sdk
# or
yarn add nsai-sdk
```

### Get Your API Key

1. Sign up at [https://nsaidata.com](https://nsaidata.com)
2. Navigate to Settings → API Keys
3. Create a new API key

### Basic Usage

**Python Example:**
```python
from nsai import NSAIClient

# Initialize client
client = NSAIClient(api_key="your-api-key")

# Create a research query
response = client.research(
    "What are the latest breakthroughs in quantum computing?",
    max_sources=20,
    output_format="markdown"
)

# Print the report
print(response.report)
print(f"Research completed in {response.duration_ms}ms")
```

**JavaScript Example:**
```javascript
import { NSAIClient } from 'nsai-sdk';

// Initialize client
const client = new NSAIClient('your-api-key');

// Create a research query
const response = await client.research(
    'What are the latest breakthroughs in quantum computing?',
    {
        maxSources: 20,
        outputFormat: 'markdown'
    }
);

// Display the report
console.log(response.report);
console.log(`Research completed in ${response.durationMs}ms`);
```

## 📚 Features

### 🤖 Multi-Agent Intelligence
- **Query Analyzer**: Understands intent and develops research strategies
- **Web Search Agent**: Discovers high-quality, relevant sources
- **Content Extractor**: Processes and extracts key information
- **Insight Generator**: Synthesizes findings into actionable insights
- **Report Formatter**: Creates professional, structured reports
- **Validation Agent**: Fact-checks and ensures accuracy

### 📊 Output Formats
- **Markdown**: Clean, formatted reports
- **JSON**: Structured data for processing
- **HTML**: Ready-to-embed reports

### 🔐 Enterprise Ready
- SOC 2 Type II compliant
- 99.9% uptime SLA
- End-to-end encryption
- GDPR compliant
- SSO/SAML support

### ⚡ Performance
- Average response time: < 5 seconds
- Process 50+ sources per query
- Concurrent request handling
- Global CDN distribution

## 💰 Pricing

| Plan | Price | Queries/Month | Features |
|------|-------|---------------|----------|
| **Free** | $0 | 10 | Basic features, community support |
| **Starter** | $29/mo | 100 | All features, email support |
| **Professional** | $99/mo | 1,000 | Priority support, custom integrations |
| **Enterprise** | Custom | Unlimited | SLA, dedicated support, on-premise option |

View full pricing at [https://nsaidata.com/pricing](https://nsaidata.com/pricing)

## 📖 Documentation

### Guides
- [Getting Started](https://docs.nsaidata.com/getting-started)
- [Authentication](https://docs.nsaidata.com/authentication)
- [API Reference](https://docs.nsaidata.com/api-reference)
- [SDK Documentation](https://docs.nsaidata.com/sdks)
- [Best Practices](https://docs.nsaidata.com/best-practices)
- [Examples](https://docs.nsaidata.com/examples)

### SDKs
- [Python SDK](https://docs.nsaidata.com/sdks/python)
- [JavaScript/TypeScript SDK](https://docs.nsaidata.com/sdks/javascript)
- [Go SDK](https://docs.nsaidata.com/sdks/go) *(coming soon)*
- [Java SDK](https://docs.nsaidata.com/sdks/java) *(coming soon)*

## 🏢 Use Cases

- **Market Research**: Analyze competitors, trends, and opportunities
- **Academic Research**: Literature reviews and citation discovery
- **Due Diligence**: Comprehensive background research
- **Content Creation**: Research-backed articles and reports
- **Business Intelligence**: Industry insights and analysis
- **Legal Research**: Case law and precedent research

## 🛟 Support

- 📧 Email: support@nsaidata.com
- 💬 Chat: Available in-app for paid plans
- 📚 Knowledge Base: [https://help.nsaidata.com](https://help.nsaidata.com)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/ehudso7/nsai-data/issues)

## 🔒 Security & Compliance

- **Data Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Control**: OAuth 2.0, API key management
- **Compliance**: SOC 2, GDPR, CCPA, HIPAA (Enterprise)
- **Monitoring**: 24/7 security monitoring
- **Auditing**: Complete audit logs

## 📊 Status & Uptime

Check our service status at [https://status.nsaidata.com](https://status.nsaidata.com)

## 🤝 Enterprise Solutions

For enterprise deployments, custom integrations, or on-premise options:
- 📧 Email: enterprise@nsaidata.com
- 📞 Schedule a demo: [https://nsaidata.com/demo](https://nsaidata.com/demo)

## ⚖️ Legal

By using NSAI Data, you agree to our:
- [Terms of Service](https://nsaidata.com/terms)
- [Privacy Policy](https://nsaidata.com/privacy)
- [Acceptable Use Policy](https://nsaidata.com/aup)

**Important**: This software is licensed for use exclusively through the NSAI Data service at https://nsaidata.com. Self-hosting or running your own instance is strictly prohibited. See [LICENSE](LICENSE) for details.

---

© 2025 NSAI Data, Inc. All rights reserved.

**Built with ❤️ by Everton Hudson**