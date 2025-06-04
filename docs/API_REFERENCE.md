# NSAI Data API Reference

Base URL: `https://api.nsaidata.com/v1`

## Authentication

All API requests require authentication using an API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

## Rate Limits

| Plan | Requests/Hour | Concurrent | Burst |
|------|--------------|------------|-------|
| Free | 10 | 1 | 2 |
| Starter | 100 | 5 | 10 |
| Professional | 1,000 | 20 | 50 |
| Enterprise | Custom | Custom | Custom |

## Endpoints

### Research

#### Create Research Query
`POST /research/query`

Create a new research query for processing.

**Request Body:**
```json
{
  "query": "string",
  "output_format": "markdown|json|html",
  "max_sources": 1-50,
  "enable_validation": true|false,
  "include_sources": true|false,
  "webhook_url": "string (optional)"
}
```

**Response:**
```json
{
  "research_id": "res_abc123",
  "status": "pending|processing|completed|failed",
  "report": "string (when completed)",
  "metadata": {
    "sources_analyzed": 15,
    "confidence_score": 92,
    "agents_used": ["QueryAnalyzer", "..."]
  },
  "sources": [...],
  "duration_ms": 3247,
  "created_at": "2025-01-03T12:00:00Z",
  "completed_at": "2025-01-03T12:00:03Z"
}
```

#### Get Research Status
`GET /research/status/{research_id}`

Check the status of a research query.

**Response:**
```json
{
  "research_id": "res_abc123",
  "status": "processing",
  "progress": 65,
  "current_step": "InsightGenerator",
  "estimated_completion": "2025-01-03T12:00:05Z"
}
```

#### Get Research History
`GET /research/history`

Retrieve your research query history.

**Query Parameters:**
- `limit` (int): Number of results (default: 10, max: 100)
- `offset` (int): Pagination offset (default: 0)
- `status` (string): Filter by status
- `from` (ISO date): Start date
- `to` (ISO date): End date

### Account

#### Get Usage Statistics
`GET /usage/{period}`

Get your API usage statistics.

**Path Parameters:**
- `period`: `current` | `last_month` | `all_time`

**Response:**
```json
{
  "period": "current",
  "queries_count": 127,
  "tokens_used": 45000,
  "sources_analyzed": 1890,
  "cost_usd": 12.70,
  "remaining_quota": 873,
  "reset_at": "2025-02-01T00:00:00Z"
}
```

### API Keys

#### Create API Key
`POST /api-keys`

Create a new API key.

**Request Body:**
```json
{
  "name": "Production Key",
  "scopes": ["read", "write"],
  "expires_in_days": 90
}
```

**Response:**
```json
{
  "id": "key_abc123",
  "name": "Production Key",
  "api_key": "sk_live_...", // Only shown once!
  "prefix": "sk_live_",
  "created_at": "2025-01-03T12:00:00Z",
  "expires_at": "2025-04-03T12:00:00Z"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "You have exceeded your rate limit",
    "type": "rate_limit_error",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset_at": "2025-01-03T13:00:00Z"
    }
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Webhooks

Configure webhooks to receive real-time updates:

```json
{
  "event": "research.completed",
  "data": {
    "research_id": "res_abc123",
    "status": "completed",
    "duration_ms": 3247
  },
  "created_at": "2025-01-03T12:00:03Z"
}
```

Verify webhook signatures using the `X-NSAI-Signature` header.