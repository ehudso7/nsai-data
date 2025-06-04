# NSAI JavaScript/TypeScript SDK

Official JavaScript SDK for [NSAI Data](https://nsaidata.com) - Enterprise Autonomous Research Platform.

## Installation

```bash
npm install nsai-sdk
# or
yarn add nsai-sdk
# or
pnpm add nsai-sdk
```

## Quick Start

```javascript
import { NSAIClient } from 'nsai-sdk';

// Initialize client
const client = new NSAIClient('your-api-key');

// Perform research
const response = await client.research('What are the latest AI developments?');
console.log(response.report);
```

## Authentication

Get your API key from [https://nsaidata.com/settings/api-keys](https://nsaidata.com/settings/api-keys)

## Usage Examples

### Basic Research

```javascript
import { NSAIClient } from 'nsai-sdk';

const client = new NSAIClient('your-api-key');

// Simple research query
const response = await client.research(
    'Compare React and Vue.js for web development',
    {
        maxSources: 20,
        outputFormat: 'markdown'
    }
);

console.log(`Research completed in ${response.durationMs}ms`);
console.log(response.report);
```

### TypeScript Example

```typescript
import { NSAIClient, ResearchResponse, ResearchQuery } from 'nsai-sdk';

const client = new NSAIClient('your-api-key');

// Type-safe research query
const options: Partial<ResearchQuery> = {
    outputFormat: 'json',
    maxSources: 30,
    enableValidation: true,
    includeSources: true
};

const response: ResearchResponse = await client.research(
    'Impact of quantum computing on cryptography',
    options
);

// Access typed properties
if (response.metadata?.validation) {
    console.log(`Confidence: ${response.metadata.validation.confidence_score}%`);
}
```

### Advanced Options

```javascript
// Research with all options
const response = await client.research(
    'Future of renewable energy',
    {
        outputFormat: 'json',      // 'markdown' | 'json' | 'html'
        maxSources: 30,           // 1-50 sources
        enableValidation: true,   // Fact-checking
        includeSources: true,     // Include citations
        webhookUrl: 'https://your-app.com/webhook'  // Optional webhook
    }
);
```

### Check Research Status

```javascript
// Get status of ongoing research
const status = await client.getResearchStatus(researchId);
console.log(`Status: ${status.status}`);
console.log(`Progress: ${status.progress}%`);
```

### Wait for Completion

```javascript
// Start research and wait for completion
const initialResponse = await client.research('Your query here');

// Wait with progress tracking
const completedResponse = await client.waitForCompletion(
    initialResponse.researchId,
    {
        pollingInterval: 2000,  // Check every 2 seconds
        timeout: 600000        // 10 minute timeout
    }
);

console.log('Research complete!', completedResponse.report);
```

### Research History

```javascript
// Get your research history
const history = await client.getResearchHistory({
    limit: 10,
    offset: 0,
    status: 'completed'
});

history.queries.forEach(query => {
    console.log(`${query.createdAt}: ${query.query.substring(0, 50)}...`);
});
```

### Error Handling

```javascript
import { NSAIClient, NSAIError, RateLimitError } from 'nsai-sdk';

const client = new NSAIClient('your-api-key');

try {
    const response = await client.research('Your query here');
} catch (error) {
    if (error instanceof RateLimitError) {
        console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    } else if (error instanceof NSAIError) {
        console.log(`API error: ${error.message}`);
    } else {
        console.log(`Unexpected error: ${error}`);
    }
}
```

### Node.js Example

```javascript
const { NSAIClient } = require('nsai-sdk');
const fs = require('fs').promises;

async function performResearch() {
    const client = new NSAIClient(process.env.NSAI_API_KEY);
    
    const response = await client.research(
        'Best practices for Node.js microservices'
    );
    
    // Save report to file
    await fs.writeFile('research-report.md', response.report);
    console.log('Report saved!');
}

performResearch();
```

## API Reference

### NSAIClient

#### `constructor(apiKey: string, options?: ClientOptions)`
Initialize the client.

**Options:**
- `baseUrl`: Custom API endpoint
- `timeout`: Request timeout in ms (default: 300000)
- `maxRetries`: Max retry attempts (default: 3)

#### `research(query: string, options?: ResearchOptions): Promise<ResearchResponse>`
Create a research query.

#### `getResearchStatus(researchId: string): Promise<ResearchStatus>`
Get status of a research query.

#### `getResearchHistory(params?: HistoryParams): Promise<HistoryResponse>`
Get research history.

#### `cancelResearch(researchId: string): Promise<{ message: string }>`
Cancel an ongoing research query.

#### `getUsage(period?: 'current' | 'last_month' | 'all_time'): Promise<UsageStats>`
Get API usage statistics.

#### `waitForCompletion(researchId: string, options?: WaitOptions): Promise<ResearchResponse>`
Wait for a research query to complete.

### Types

```typescript
interface ResearchResponse {
    researchId: string;
    status: string;
    report?: string;
    metadata?: Record<string, any>;
    sources?: Array<{
        url: string;
        title: string;
        snippet?: string;
    }>;
    durationMs?: number;
    createdAt: string;
    completedAt?: string;
    error?: string;
}

interface ResearchStatus {
    researchId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    currentStep?: string;
    estimatedCompletion?: string;
    createdAt: string;
    updatedAt: string;
}
```

## Browser Usage

The SDK works in modern browsers with ES modules:

```html
<script type="module">
import { NSAIClient } from 'https://cdn.jsdelivr.net/npm/nsai-sdk/dist/index.esm.js';

const client = new NSAIClient('your-api-key');
// Use the client
</script>
```

## Rate Limits

- Free tier: 10 requests/hour
- Starter: 100 requests/hour
- Professional: 1,000 requests/hour
- Enterprise: Custom limits

## Support

- Documentation: [https://docs.nsaidata.com](https://docs.nsaidata.com)
- Support: support@nsaidata.com
- Issues: [GitHub Issues](https://github.com/ehudso7/nsai-data/issues)