#!/bin/bash

# SIYABONA Mobile IPS Deployment Script
# This script deploys the complete SIYABONA application

set -e

echo "🚀 SIYABONA Mobile IPS Deployment Starting..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

command -v docker >/dev/null 2>&1 || {
    echo -e "${RED}Docker is required but not installed. Aborting.${NC}" >&2
    exit 1
}

command -v docker-compose >/dev/null 2>&1 || {
    echo -e "${RED}docker-compose is required but not installed. Aborting.${NC}" >&2
    exit 1
}

echo -e "${GREEN}✓ Docker found${NC}"
echo -e "${GREEN}✓ Docker Compose found${NC}"

# Check for .env file
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  IMPORTANT: Edit .env and set secure passwords before deploying!${NC}"
    echo -e "${YELLOW}Press Enter to edit .env or Ctrl+C to abort...${NC}"
    read
    ${EDITOR:-nano} .env
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create necessary directories
echo -e "\n${YELLOW}Creating directories...${NC}"
mkdir -p logs/nginx
mkdir -p backup
mkdir -p nginx/ssl
mkdir -p backend/logs

echo -e "${GREEN}✓ Directories created${NC}"

# Check for SSL certificates (production)
if [ "$NODE_ENV" = "production" ]; then
    echo -e "\n${YELLOW}Checking SSL certificates...${NC}"
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        echo -e "${RED}⚠️  SSL certificates not found in nginx/ssl/${NC}"
        echo -e "${YELLOW}For production, you need SSL certificates.${NC}"
        echo -e "${YELLOW}Continue without SSL? (y/n)${NC}"
        read -r response
        if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✓ SSL certificates found${NC}"
    fi
fi

# Stop existing containers
echo -e "\n${YELLOW}Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true

# Build and start containers
echo -e "\n${YELLOW}Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for services to be ready
echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check MongoDB
echo -e "\n${YELLOW}Checking MongoDB connection...${NC}"
docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1 && \
    echo -e "${GREEN}✓ MongoDB is running${NC}" || \
    echo -e "${RED}✗ MongoDB connection failed${NC}"

# Check Redis
echo -e "\n${YELLOW}Checking Redis connection...${NC}"
docker-compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis_password}" ping >/dev/null 2>&1 && \
    echo -e "${GREEN}✓ Redis is running${NC}" || \
    echo -e "${RED}✗ Redis connection failed${NC}"

# Check Backend API
echo -e "\n${YELLOW}Checking Backend API health...${NC}"
sleep 5
curl -f http://localhost:3000/health >/dev/null 2>&1 && \
    echo -e "${GREEN}✓ Backend API is healthy${NC}" || \
    echo -e "${RED}✗ Backend API health check failed${NC}"

# Show container status
echo -e "\n${YELLOW}Container Status:${NC}"
docker-compose ps

# Show service URLs
echo -e "\n${GREEN}=============================================="
echo -e "✅ Deployment Complete!"
echo -e "==============================================${NC}"
echo -e "\n${YELLOW}Service URLs:${NC}"
echo -e "📱 Backend API:    http://localhost:3000"
echo -e "🔍 API Docs:       http://localhost:3000/api"
echo -e "🏥 Health Check:   http://localhost:3000/health"
echo -e "🔒 MongoDB:        localhost:27017"
echo -e "💾 Redis:          localhost:6379"
echo -e "🌐 Nginx Proxy:    http://localhost:80"

echo -e "\n${YELLOW}View Logs:${NC}"
echo -e "   Backend:   docker-compose logs -f backend"
echo -e "   MongoDB:   docker-compose logs -f mongodb"
echo -e "   All:       docker-compose logs -f"

echo -e "\n${YELLOW}Management Commands:${NC}"
echo -e "   Stop:      docker-compose down"
echo -e "   Restart:   docker-compose restart"
echo -e "   Status:    docker-compose ps"

echo -e "\n${GREEN}🎉 SIYABONA is now protecting users from scams!${NC}\n"

# Test API
echo -e "${YELLOW}Running quick API test...${NC}"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/scan/sms \
  -H "Content-Type: application/json" \
  -d '{"message": "CAPITEC: Your account has been suspended. Click http://malicious.com", "consentGiven": true}')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ API test successful${NC}"
    RISK_SCORE=$(echo $RESPONSE | grep -o '"riskScore":[0-9]*' | cut -d':' -f2)
    if [ ! -z "$RISK_SCORE" ]; then
        echo -e "${GREEN}  Risk Score: ${RISK_SCORE}%${NC}"
    fi
else
    echo -e "${RED}✗ API test failed${NC}"
fi

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Configure your domain and SSL certificates for production"
echo -e "2. Update ALLOWED_ORIGINS in .env"
echo -e "3. Set up monitoring and alerts"
echo -e "4. Configure backup strategy"
echo -e "5. Review security settings"

echo -e "\n${GREEN}Happy scam hunting! 🛡️${NC}\n"
