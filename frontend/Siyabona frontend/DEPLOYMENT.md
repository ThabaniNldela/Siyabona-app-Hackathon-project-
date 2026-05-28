# SIYABONA Deployment Guide

This guide provides step-by-step instructions for deploying the SIYABONA Mobile IPS application.

## 🎯 Quick Deployment

For a quick deployment, simply run:

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Check prerequisites (Docker, Docker Compose)
- Create necessary directories
- Copy environment template
- Build and start all services
- Run health checks
- Display service URLs and management commands

## 📋 Prerequisites

### Required Software
- Docker 20.10+ 
- Docker Compose 2.0+
- Git

### Optional (for local development)
- Node.js 18+
- MongoDB 6.0+
- Redis 7+

### System Requirements
- **Minimum**: 2 CPU cores, 4GB RAM, 20GB disk
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB disk

## 🔧 Step-by-Step Deployment

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/siyabona.git
cd siyabona
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env
```

**CRITICAL**: Update these values in `.env`:
```env
# Change these passwords!
MONGO_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_key_change_this
REDIS_PASSWORD=your_redis_password

# Update for production
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com

# Optional: Add API keys for enhanced protection
GOOGLE_SAFE_BROWSING_API_KEY=your_api_key
VIRUSTOTAL_API_KEY=your_api_key
```

### 3. Setup SSL Certificates (Production)

For HTTPS in production:
```bash
mkdir -p nginx/ssl
# Copy your SSL certificates
cp /path/to/your/cert.pem nginx/ssl/
cp /path/to/your/key.pem nginx/ssl/
```

Or use Let's Encrypt:
```bash
# Using certbot
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

Then uncomment the HTTPS server block in `nginx/nginx.conf`.

### 4. Build and Deploy
```bash
docker-compose up -d --build
```

### 5. Verify Deployment
```bash
# Check containers are running
docker-compose ps

# Check backend health
curl http://localhost:3000/health

# View logs
docker-compose logs -f backend
```

## 🌐 Production Checklist

- [ ] Change all default passwords in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure SSL certificates
- [ ] Update `ALLOWED_ORIGINS` to your domain
- [ ] Enable HTTPS in nginx configuration
- [ ] Set up firewall rules
- [ ] Configure monitoring (see Monitoring section)
- [ ] Set up automated backups (see Backup section)
- [ ] Test all endpoints
- [ ] Enable log rotation
- [ ] Configure domain DNS

## 🔒 Security Hardening

### Firewall Configuration
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if needed)
sudo ufw allow 22/tcp

# Block direct access to services
sudo ufw deny 3000/tcp
sudo ufw deny 27017/tcp
sudo ufw deny 6379/tcp

# Enable firewall
sudo ufw enable
```

### Update Nginx Security Headers
Already configured in `nginx/nginx.conf`:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Referrer-Policy

### MongoDB Security
```bash
# Connect to MongoDB container
docker-compose exec mongodb mongosh -u admin -p

# Create application user with limited permissions
use siyabona
db.createUser({
  user: "siyabona_app",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "siyabona" }]
})
```

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# MongoDB health
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Redis health
docker-compose exec redis redis-cli -a password ping
```

### Log Monitoring
```bash
# Backend logs
tail -f backend/logs/combined.log

# Nginx access logs
tail -f logs/nginx/access.log

# Nginx error logs
tail -f logs/nginx/error.log

# All container logs
docker-compose logs -f
```

### Metrics & Alerts
Consider integrating:
- **Prometheus** for metrics
- **Grafana** for dashboards
- **Elasticsearch + Kibana** for log analysis
- **Sentry** for error tracking

## 💾 Backup Strategy

### MongoDB Backup
```bash
# Backup script
#!/bin/bash
BACKUP_DIR="./backup"
DATE=$(date +%Y%m%d_%H%M%S)

docker-compose exec -T mongodb mongodump \
  --username=admin \
  --password=password \
  --authenticationDatabase=admin \
  --db=siyabona \
  --archive=/backup/siyabona_${DATE}.archive

# Compress
gzip ${BACKUP_DIR}/siyabona_${DATE}.archive
```

### Automated Backups
Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/siyabona/backup.sh

# Weekly cleanup (keep last 30 days)
0 3 * * 0 find /path/to/siyabona/backup -name "*.gz" -mtime +30 -delete
```

### Restore Backup
```bash
docker-compose exec -T mongodb mongorestore \
  --username=admin \
  --password=password \
  --authenticationDatabase=admin \
  --archive=/backup/siyabona_20240517.archive.gz \
  --gzip
```

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f backend
```

### Database Migrations
```bash
# Create migration
cd backend
npm run migration:create

# Run migrations
npm run migration:run
```

### Clear Cache
```bash
# Clear Redis cache
docker-compose exec redis redis-cli -a password FLUSHALL
```

## 📈 Scaling

### Horizontal Scaling with Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml siyabona

# Scale backend
docker service scale siyabona_backend=3
```

### Load Balancing
Update `nginx/nginx.conf` for multiple backend instances:
```nginx
upstream backend {
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
    keepalive 32;
}
```

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Check resources
docker stats

# Rebuild
docker-compose down
docker-compose up -d --build --force-recreate
```

### Database connection issues
```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check connection
docker-compose exec backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
"
```

### High memory usage
```bash
# Check container stats
docker stats

# Restart specific service
docker-compose restart backend

# Optimize MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand({setParameter: 1, internalQueryExecMaxBlockingSortBytes: 335544320})"
```

## 🔍 Testing Deployment

### API Tests
```bash
# Test SMS scan
curl -X POST http://localhost:3000/api/scan/sms \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test scam: CAPITEC suspended account click link",
    "consentGiven": true
  }'

# Test URL scan
curl -X POST http://localhost:3000/api/scan/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://suspicious-site.xyz"
  }'

# Get stats
curl http://localhost:3000/api/scan/stats
```

### Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 -p test_payload.json \
  -T application/json \
  http://localhost:3000/api/scan/sms
```

## 📞 Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Review documentation
3. Open GitHub issue with logs and error details
4. Contact support: support@siyabona.app

## 🎉 Post-Deployment

After successful deployment:
1. Monitor logs for 24 hours
2. Test all critical paths
3. Set up monitoring alerts
4. Document any custom configurations
5. Train team on operations
6. Plan regular security audits

---

**Congratulations! SIYABONA is now protecting users from scams.**
