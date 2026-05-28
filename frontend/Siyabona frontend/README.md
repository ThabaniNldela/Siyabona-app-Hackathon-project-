# SIYABONA Mobile IPS
## AI-Powered Scam Detection for South Africa

![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

**SIYABONA** (meaning "We see you" in Zulu) is a comprehensive mobile intrusion prevention system designed to protect South Africans from SMS, WhatsApp, and online scams.

## 🚀 Features

### Scam Detection
- **SMS Scam Detection** - Analyzes text messages for fraud patterns
- **WhatsApp Fraud Detection** - Detects impersonation and voice note scams
- **URL Analysis** - Checks links for phishing and malware
- **Real-time Analysis** - Instant risk scoring with explainable AI

### South Africa-Specific Protection
- ✅ Fake bank SMS (Capitec, FNB, Standard Bank, ABSA, Nedbank)
- ✅ SARS phishing attempts
- ✅ Delivery scams (Takealot, Woolworths)
- ✅ WhatsApp family emergency scams
- ✅ Job offer fraud
- ✅ Airtime voucher scams
- ✅ OTP harvesting attacks
- ✅ Investment & romance scams

### Security & Compliance
- 🔒 **TLS 1.3** encryption in transit
- 🔒 **AES-256** encryption at rest
- 🔒 **POPIA compliant** with consent management
- 🔒 **Data anonymization** via SHA-256 hashing
- 🔒 **30-day retention** policy
- 🔒 **Zero-trust** architecture

### Technical Stack
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB with encryption
- **Cache**: Redis for performance
- **Frontend**: React, Tailwind CSS
- **Deployment**: Docker, Docker Compose
- **Proxy**: Nginx with rate limiting

## 📱 Application Screens

1. **Home Dashboard** - Stats, alerts, and safety tips
2. **Scan Screen** - Multi-tab scanner for SMS/WhatsApp/URLs
3. **History** - View past scans and results
4. **Report** - Community-driven scam reporting
5. **Profile** - Settings and preferences

## 🛠️ Installation

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB 6.0+

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/siyabona.git
   cd siyabona
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and set secure passwords
   nano .env
   ```

3. **Build and start services**
   ```bash
   docker-compose up -d --build
   ```

4. **Check service health**
   ```bash
   docker-compose ps
   curl http://localhost:3000/health
   ```

5. **View logs**
   ```bash
   docker-compose logs -f backend
   ```

### Local Development

1. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start MongoDB locally**
   ```bash
   docker run -d -p 27017:27017 \
     -e MONGO_INITDB_ROOT_USERNAME=admin \
     -e MONGO_INITDB_ROOT_PASSWORD=password \
     mongo:6.0
   ```

3. **Start backend server**
   ```bash
   npm run dev
   ```

4. **Install frontend dependencies**
   ```bash
   cd ..
   pnpm install
   ```

5. **Start frontend dev server**
   ```bash
   pnpm dev
   ```

## 🔌 API Endpoints

### Scan Endpoints
```
POST /api/scan/sms
POST /api/scan/whatsapp
POST /api/scan/url
POST /api/scan/bulk
GET  /api/scan/stats
```

### Report Endpoints
```
POST /api/report
GET  /api/report
```

### Stats Endpoints
```
GET /api/stats/global
GET /api/stats/scams
```

### Health Check
```
GET /health
```

## 📊 API Example

### Scan SMS
```bash
curl -X POST http://localhost:3000/api/scan/sms \
  -H "Content-Type: application/json" \
  -d '{
    "message": "CAPITEC: Your account has been suspended. Click https://capitec-verify.xyz to restore access.",
    "senderNumber": "+27123456789",
    "consentGiven": true
  }'
```

### Response
```json
{
  "success": true,
  "result": {
    "riskScore": 95,
    "riskLevel": "dangerous",
    "signals": ["urgency", "impersonation", "suspicious_url"],
    "explanation": "⚠️ SCAM ALERT: This message is impersonating a South African bank...",
    "confidence": 98,
    "detectedScamType": "fake_bank_sms"
  }
}
```

## 🔐 Security Features

### Rate Limiting
- **Global**: 100 requests per 15 minutes
- **Scan API**: 10 requests per minute

### Data Protection
- User IDs anonymized with SHA-256
- Phone numbers hashed before storage
- Message content encrypted at rest
- Auto-deletion after 30 days (POPIA)

### Network Security
- Helmet.js security headers
- CORS with whitelist
- MongoDB injection protection
- TLS 1.3 for HTTPS
- HSTS enabled

## 📈 Scam Detection Accuracy

Our AI detection engine analyzes:
- **Urgency tactics** (15% weight)
- **Brand impersonation** (25% weight)
- **Phishing patterns** (30% weight)
- **Emotional manipulation** (12% weight)
- **Money requests** (8% weight)
- **URL analysis** (15% weight)
- **Sender verification** (10% weight)

## 🚢 Deployment

### Production Deployment

1. **Set production environment**
   ```bash
   export NODE_ENV=production
   ```

2. **Configure SSL certificates**
   ```bash
   mkdir -p nginx/ssl
   # Add your SSL certificates
   cp /path/to/cert.pem nginx/ssl/
   cp /path/to/key.pem nginx/ssl/
   ```

3. **Update nginx.conf for HTTPS**
   - Uncomment HTTPS server block
   - Update server_name to your domain

4. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

5. **Monitor logs**
   ```bash
   tail -f backend/logs/combined.log
   tail -f logs/nginx/access.log
   ```

### Scaling

- Use Docker Swarm or Kubernetes for horizontal scaling
- Configure MongoDB replica sets for high availability
- Add Redis cluster for distributed caching
- Use load balancer for multiple backend instances

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Test SMS scan
curl -X POST http://localhost:3000/api/scan/sms \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message", "consentGiven": true}'
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Backend server port | 3000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/siyabona |
| JWT_SECRET | JWT signing secret | (required) |
| ALLOWED_ORIGINS | CORS allowed origins | http://localhost:3000 |
| REDIS_PASSWORD | Redis password | (required) |

See `.env.example` for full configuration.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- South African Banking Risk Information Centre (SABRIC)
- POPIA compliance guidelines
- Community scam reports

## 📞 Support

- **Email**: support@siyabona.app
- **Issues**: https://github.com/yourusername/siyabona/issues
- **Documentation**: https://docs.siyabona.app

## ⚠️ Disclaimer

SIYABONA is a detection tool and cannot guarantee 100% accuracy. Always verify suspicious messages through official channels. Never share OTPs, passwords, or banking details via SMS or phone.

---

**Stay Safe. Stay Protected. SIYABONA.**
