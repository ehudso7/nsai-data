# NSAI Data Production Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Domain name and hosting provider (Vercel, AWS, etc.)
- SMTP service for emails (SendGrid, AWS SES, etc.)

## Step 1: Database Setup

1. Create a PostgreSQL database:
```bash
createdb nsai_data_production
```

2. Update your `.env.local` with the production database URL:
```
DATABASE_URL=postgresql://username:password@host:5432/nsai_data_production
```

3. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate deploy
```

## Step 2: Environment Configuration

1. Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

2. Create `.env.production` with all required variables:
```env
# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-generated-secret

# Database
DATABASE_URL=your-production-database-url

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# Security
ALLOWED_ORIGINS=https://yourdomain.com

# Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
SENTRY_DSN=your-sentry-dsn
```

## Step 3: Build and Test

1. Install dependencies:
```bash
npm install --production
```

2. Build the application:
```bash
npm run build
```

3. Test the production build locally:
```bash
npm start
```

## Step 4: Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variables in Vercel dashboard

## Step 5: Post-Deployment

1. Test all critical paths:
   - User registration and login
   - Research query submission
   - Contact form
   - API endpoints

2. Monitor health endpoint:
```bash
curl https://yourdomain.com/api/health
```

3. Set up monitoring:
   - Configure Sentry for error tracking
   - Set up uptime monitoring
   - Configure log aggregation

## Security Checklist

- [ ] All environment variables are set
- [ ] Database is secured with strong credentials
- [ ] HTTPS is enabled
- [ ] Rate limiting is active
- [ ] CORS is properly configured
- [ ] Security headers are set
- [ ] API keys are rotated regularly

## Maintenance

### Regular Tasks
- Monitor error logs
- Review API usage metrics
- Update dependencies monthly
- Backup database regularly

### Scaling Considerations
- Implement Redis for caching
- Use connection pooling for database
- Consider CDN for static assets
- Implement queue system for research queries

## Troubleshooting

### Database Connection Issues
```bash
npx prisma db pull
npx prisma generate
```

### Build Failures
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Authentication Issues
- Verify NEXTAUTH_URL matches your domain
- Check NEXTAUTH_SECRET is set correctly
- Ensure database migrations are run

## Support

For issues specific to your deployment, check:
1. Application logs
2. Health endpoint: `/api/health`
3. Metrics endpoint: `/api/metrics` (admin only)