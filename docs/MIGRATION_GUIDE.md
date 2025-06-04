# Migration Guide

## Migrating from Beta to v1.0

### Breaking Changes

#### Python SDK

**Before (Beta):**
```python
from nsai import Client

client = Client(api_key="...")
result = client.query("Your question")
```

**After (v1.0):**
```python
from nsai import NSAIClient

client = NSAIClient(api_key="...")
response = client.research("Your question")
```

#### JavaScript SDK

**Before (Beta):**
```javascript
const NSAI = require('nsai-sdk');
const client = new NSAI('api-key');
```

**After (v1.0):**
```javascript
import { NSAIClient } from 'nsai-sdk';
const client = new NSAIClient('api-key');
```

### New Features in v1.0

1. **Webhook Support**
   ```python
   response = client.research(
       "Your query",
       webhook_url="https://your-app.com/webhook"
   )
   ```

2. **Output Formats**
   - Added HTML output format
   - Improved JSON structure
   - Enhanced Markdown formatting

3. **Validation**
   - New confidence scores
   - Fact-checking metadata
   - Source verification

### Deprecations

- `client.query()` → Use `client.research()`
- `simple_mode` parameter → Removed
- `return_raw` parameter → Use `output_format='json'`

### Migration Checklist

- [ ] Update SDK to latest version
- [ ] Replace deprecated method names
- [ ] Update error handling for new error codes
- [ ] Test webhook integrations
- [ ] Review new rate limits
- [ ] Update API key permissions

For assistance with migration, contact support@nsaidata.com