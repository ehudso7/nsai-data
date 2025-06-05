# Environment Variables Guide

## Overview

NSAI Data uses environment variables for configuration. This guide explains all available variables and their usage.

## Environment Files

- `.env.local` - Local development (ignored by git)
- `.env.production` - Production values (committed as template)
- `.env.test` - Testing environment (ignored by git)
- `.env.example` - Backend example (for reference)
- `.env.local.example` - Frontend example (for reference)

## Frontend Variables (NEXT_PUBLIC_*)

All frontend environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### Required Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.nsaidata.com
NEXT_PUBLIC_APP_URL=https://nsaidata.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
```

### Optional Variables

```bash
# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxxxx

# Third-party Services
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Contact Information
NEXT_PUBLIC_SUPPORT_EMAIL=support@nsaidata.com
NEXT_PUBLIC_SALES_EMAIL=sales@nsaidata.com

# Social Links
NEXT_PUBLIC_TWITTER_HANDLE=@nsaidata
NEXT_PUBLIC_GITHUB_URL=https://github.com/ehudso7/nsai-data
```

## Backend Variables (Private)

These variables are only used server-side and should NEVER be exposed to the client.

### Critical Security Variables

```bash
# Never commit these!
OPENAI_API_KEY=sk-xxxxx              # OpenAI API key
FIRECRAWL_API_KEY=fc_xxxxx           # Firecrawl API key
DATABASE_URL=postgresql://...         # Database connection
REDIS_URL=redis://...                # Redis connection
JWT_SECRET=xxxxx                     # JWT signing secret
STRIPE_SECRET_KEY=sk_live_xxxxx      # Stripe secret key
SENDGRID_API_KEY=SG.xxxxx           # SendGrid API key
```

## Vercel Configuration

### Setting Variables in Vercel

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add each variable with appropriate environment scope:
   - `Production` - Only for production deployments
   - `Preview` - For preview deployments
   - `Development` - For development

### Best Practices

1. **Use Vercel CLI**:
   ```bash
   vercel env add OPENAI_API_KEY production
   ```

2. **Bulk Import**:
   ```bash
   vercel env pull .env.local
   ```

3. **Secrets Management**:
   - Use Vercel's encrypted secrets
   - Rotate keys regularly
   - Use different keys for each environment

## Local Development Setup

1. **Copy the example files**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in your development values**:
   ```bash
   # .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_ENABLE_DEMO_MODE=true
   ```

3. **Never commit .env.local**:
   - It's already in .gitignore
   - Use examples for documentation

## Production Deployment

1. **Set all required variables in Vercel**
2. **Verify with build logs**:
   ```
   info  - Loaded env from .env.production
   ```
3. **Test after deployment**:
   - Check browser console for missing variables
   - Verify API connections

## Debugging

### Check loaded variables:
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

### Common Issues:

1. **Variable not available in browser**:
   - Ensure it starts with `NEXT_PUBLIC_`
   - Rebuild after adding

2. **Variable undefined**:
   - Check spelling
   - Verify it's set in Vercel
   - Clear cache and rebuild

3. **Wrong environment**:
   - Check Vercel dashboard
   - Verify deployment environment

## Security Notes

- ⚠️ Never expose private API keys
- ⚠️ Don't commit real credentials
- ⚠️ Use different keys per environment
- ⚠️ Rotate keys regularly
- ⚠️ Monitor for exposed secrets

## Reference

For more details, see:
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)