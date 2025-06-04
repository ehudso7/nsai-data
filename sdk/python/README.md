# NSAI Python SDK

Official Python SDK for [NSAI Data](https://nsai-data.com) - Enterprise Autonomous Research Platform.

## Installation

```bash
pip install nsai
```

## Quick Start

```python
from nsai import NSAIClient

# Initialize client
client = NSAIClient(api_key="your-api-key")

# Perform research
response = client.research("What are the latest AI developments?")
print(response.report)
```

## Authentication

Get your API key from [https://nsai-data.com/settings/api-keys](https://nsai-data.com/settings/api-keys)

You can provide your API key in two ways:

1. Pass directly to client:
```python
client = NSAIClient(api_key="your-api-key")
```

2. Set environment variable:
```bash
export NSAI_API_KEY="your-api-key"
```

## Usage Examples

### Basic Research

```python
from nsai import NSAIClient

client = NSAIClient()

# Simple research query
response = client.research(
    "Compare Python and JavaScript for web development",
    max_sources=20,
    output_format="markdown"
)

print(f"Research completed in {response.duration_ms}ms")
print(response.report)
```

### Advanced Options

```python
# Research with all options
response = client.research(
    query="Impact of quantum computing on cryptography",
    output_format="json",  # "markdown", "json", or "html"
    max_sources=30,        # 1-50 sources
    enable_validation=True, # Fact-checking
    include_sources=True,   # Include citations
    webhook_url="https://your-app.com/webhook"  # Optional webhook
)

# Access structured data (JSON format)
if response.metadata:
    print(f"Confidence: {response.confidence_score}%")
    print(f"Sources analyzed: {response.metadata['sources_analyzed']}")
```

### Check Research Status

```python
# Get status of ongoing research
status = client.get_research_status(research_id)
print(f"Status: {status.status}")
print(f"Progress: {status.progress}%")
```

### Research History

```python
# Get your research history
history = client.get_research_history(limit=10, offset=0)

for query in history["queries"]:
    print(f"{query['created_at']}: {query['query'][:50]}...")
```

### API Key Management

```python
# Create a new API key
new_key = client.create_api_key(
    name="Production Key",
    scopes=["read", "write"]
)
print(f"New API key: {new_key['api_key']}")  # Save this!

# List API keys
keys = client.list_api_keys()
for key in keys:
    print(f"{key['name']}: {key['prefix']}... (created: {key['created_at']})")

# Revoke a key
client.revoke_api_key(key_id="key-id-to-revoke")
```

### Error Handling

```python
from nsai import NSAIClient, NSAIError, RateLimitError

client = NSAIClient()

try:
    response = client.research("Your query here")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except NSAIError as e:
    print(f"API error: {e}")
```

### Context Manager

```python
# Automatic cleanup with context manager
with NSAIClient() as client:
    response = client.research("Your query")
    print(response.report)
```

## API Reference

### NSAIClient

#### `__init__(api_key=None, base_url=None, timeout=300.0, max_retries=3)`
Initialize the client.

#### `research(query, output_format="markdown", max_sources=10, enable_validation=True, include_sources=True, webhook_url=None)`
Create a research query.

#### `get_research_status(research_id)`
Get status of a research query.

#### `get_research_history(limit=10, offset=0, status=None)`
Get research history.

#### `cancel_research(research_id)`
Cancel an ongoing research query.

#### `get_usage(period="current")`
Get API usage statistics.

### Models

#### `ResearchResponse`
- `research_id`: Unique identifier
- `status`: Query status
- `report`: Generated report
- `metadata`: Additional data
- `sources`: List of sources
- `duration_ms`: Processing time
- `confidence_score`: Validation score (if enabled)

#### `ResearchStatus`
- `research_id`: Unique identifier
- `status`: Current status
- `progress`: Completion percentage
- `current_step`: Current processing step

## Rate Limits

- Free tier: 10 requests/hour
- Starter: 100 requests/hour
- Professional: 1,000 requests/hour
- Enterprise: Custom limits

## Support

- Documentation: [https://docs.nsai-data.com](https://docs.nsai-data.com)
- Support: support@nsai-data.com
- Issues: [GitHub Issues](https://github.com/ehudso7/nsai-data/issues)