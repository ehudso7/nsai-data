# NSAI Data Deployment Guide

This guide provides comprehensive instructions for deploying the NSAI Data platform in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Production Deployment](#production-deployment)
4. [Cloud Deployments](#cloud-deployments)
5. [Configuration](#configuration)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Security Checklist](#security-checklist)

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- OpenAI API Key
- (Optional) Firecrawl API Key
- (Optional) Domain name with SSL certificate
- (Optional) Cloud provider account (AWS, GCP, Azure, Railway)

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/ehudso7/nsai-data.git
cd nsai-data

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env
```

### 2. Local Development

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Access the application
# Frontend: http://localhost
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 3. Stop Services

```bash
docker-compose down
```

## Production Deployment

### Using Docker Compose

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Scale the application
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

### Manual Docker Deployment

```bash
# Build production image
docker build -t nsai-data:latest .

# Run with environment file
docker run -d \
  --name nsai-data \
  -p 80:80 \
  -p 443:443 \
  --env-file .env.prod \
  -v ./ssl:/etc/nginx/ssl:ro \
  nsai-data:latest
```

## Cloud Deployments

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Deploy
railway up

# Set environment variables
railway variables set OPENAI_API_KEY=your-key
railway variables set FIRECRAWL_API_KEY=your-key
```

### AWS ECS

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker build -t nsai-data .
docker tag nsai-data:latest $ECR_REGISTRY/nsai-data:latest
docker push $ECR_REGISTRY/nsai-data:latest

# Update task definition
aws ecs update-service \
  --cluster nsai-cluster \
  --service nsai-service \
  --force-new-deployment
```

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/$PROJECT_ID/nsai-data

# Deploy
gcloud run deploy nsai-data \
  --image gcr.io/$PROJECT_ID/nsai-data \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="OPENAI_API_KEY=$OPENAI_API_KEY"
```

### Kubernetes

```bash
# Create namespace
kubectl create namespace nsai-data

# Create secrets
kubectl create secret generic nsai-secrets \
  --from-env-file=.env.prod \
  -n nsai-data

# Apply manifests
kubectl apply -f k8s/ -n nsai-data

# Check deployment
kubectl get pods -n nsai-data
kubectl get svc -n nsai-data
```

### Heroku

```bash
# Create app
heroku create nsai-data

# Set buildpack
heroku buildpacks:set heroku/python

# Set environment variables
heroku config:set OPENAI_API_KEY=your-key
heroku config:set FIRECRAWL_API_KEY=your-key

# Deploy
git push heroku main

# Scale
heroku ps:scale web=2
```

## Configuration

### Essential Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
SECRET_KEY=your-secret-key-min-32-chars
API_KEY_SALT=your-api-salt-min-16-chars

# Recommended for Production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://redis:6379/0
SENTRY_DSN=https://...@sentry.io/...
ENABLE_HTTPS=true
```

### SSL/TLS Setup

```bash
# Generate self-signed certificate (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem

# For production, use Let's Encrypt
docker run -it --rm \
  -v ./ssl:/etc/letsencrypt \
  certbot/certbot certonly \
  --standalone \
  -d nsaidata.com \
  -d www.nsaidata.com
```

### Database Migrations

```bash
# Run migrations
docker-compose exec app alembic upgrade head

# Create new migration
docker-compose exec app alembic revision --autogenerate -m "Description"
```

## Monitoring

### Prometheus & Grafana

```bash
# Access monitoring dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)

# Import dashboard
# 1. Login to Grafana
# 2. Go to Dashboards > Import
# 3. Upload grafana-dashboard.json
```

### Health Checks

```bash
# Check application health
curl http://localhost:8000/health

# Check all services
docker-compose ps

# View metrics
curl http://localhost:8000/metrics
```

### Logging

```bash
# View application logs
docker-compose logs -f app

# View nginx logs
docker-compose logs -f nginx

# Export logs
docker-compose logs > deployment.log
```

## Troubleshooting

### Common Issues

#### 1. Container won't start
```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose config

# Check port conflicts
netstat -tulpn | grep -E '(80|443|8000)'
```

#### 2. Database connection errors
```bash
# Test database connection
docker-compose exec app python -c "
from backend.core.database import engine
engine.connect()
print('Database connected!')
"

# Reset database
docker-compose down -v
docker-compose up -d
```

#### 3. API key errors
```bash
# Verify API keys
docker-compose exec app python -c "
import os
print(f'OpenAI Key: {os.getenv('OPENAI_API_KEY')[:10]}...')
"
```

#### 4. Performance issues
```bash
# Check resource usage
docker stats

# Increase resources
docker-compose -f docker-compose.prod.yml up -d --scale app=5

# Check rate limits
redis-cli --eval check_rate_limits.lua
```

### Debug Mode

```bash
# Enable debug mode (development only)
docker-compose exec app bash
export DEBUG=true
python -m uvicorn backend.main:app --reload
```

## Security Checklist

Before deploying to production:

- [ ] Change all default passwords and secrets
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up backup strategy
- [ ] Configure monitoring and alerts
- [ ] Review and update CORS settings
- [ ] Enable security headers
- [ ] Implement DDoS protection
- [ ] Regular security updates

### Security Headers

```nginx
# Nginx security headers (already configured)
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https:;" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Backup Strategy

```bash
# Backup database
docker-compose exec postgres pg_dump -U nsaidata nsaidata > backup.sql

# Backup Redis
docker-compose exec redis redis-cli SAVE
docker cp nsai-redis:/data/dump.rdb ./redis-backup.rdb

# Automated backups (add to crontab)
0 2 * * * /path/to/backup-script.sh
```

## Support

For issues and questions:

- GitHub Issues: https://github.com/ehudso7/nsai-data/issues
- Documentation: https://docs.nsaidata.com
- Email: support@nsaidata.com

---

Built with ❤️ by Everton Hudson