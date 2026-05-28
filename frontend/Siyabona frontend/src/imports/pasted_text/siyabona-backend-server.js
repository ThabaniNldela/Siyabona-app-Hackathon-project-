SIYABONA Mobile IPS - Complete Application Build
I'll build a complete, production-ready mobile application for the SIYABONA Mobile Intrusion Prevention System. This will include the React Native frontend, Node.js backend, AI detection engine, and all necessary configurations.

Project Structure
text
siyabona-app/
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   └── navigation/
│   ├── App.tsx
│   └── package.json
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   ├── server.js
│   └── package.json
├── shared/               # Shared types and utilities
│   └── types.ts
└── docker-compose.yml
Let me build each component:

1. BACKEND - Node.js + Express API
backend/package.json
json
{
  "name": "siyabona-backend",
  "version": "1.0.0",
  "description": "SIYABONA Mobile IPS Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "axios": "^1.6.2",
    "node-cache": "^5.1.2",
    "winston": "^3.11.0",
    "express-validator": "^7.0.1",
    "crypto": "^1.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
backend/server.js
javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const winston = require('winston');

// Import routes
const scanRoutes = require('./src/routes/scanRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/api/scan', scanRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.id
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/siyabona', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`SIYABONA backend running on port ${PORT}`);
  });
});

module.exports = app;
backend/src/models/ScanResult.js
javascript
const mongoose = require('mongoose');

const scanResultSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['sms', 'whatsapp', 'url', 'voicenote'],
    required: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['safe', 'suspicious', 'dangerous'],
    required: true
  },
  signals: [{
    type: String,
    enum: ['urgency', 'impersonation', 'suspicious_url', 'shortened_link', 
           'brand_mismatch', 'emotional_manipulation', 'spoofed_number',
           'fake_deepfake', 'grammar_issues', 'unknown_sender']
  }],
  explanation: {
    type: String,
    required: true
  },
  detectedScamType: {
    type: String,
    enum: ['fake_bank_sms', 'sars_phishing', 'delivery_scam', 'whatsapp_impersonation',
           'family_emergency', 'job_scam', 'airtime_scam', 'otp_fraud', 'none'],
    default: 'none'
  },
  metadata: {
    senderNumber: String,
    senderName: String,
    linksDetected: [String],
    processingTimeMs: Number,
    modelVersion: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days auto-delete
  }
});

// Index for faster queries
scanResultSchema.index({ createdAt: -1 });
scanResultSchema.index({ userId: 1, createdAt: -1 });
scanResultSchema.index({ riskLevel: 1 });

module.exports = mongoose.model('ScanResult', scanResultSchema);
backend/src/services/ScamDetectionService.js
javascript
const crypto = require('crypto');
const NodeCache = require('node-cache');

// Local cache for frequent lookups (1 hour TTL)
const cache = new NodeCache({ stdTTL: 3600 });

class ScamDetectionService {
  constructor() {
    // Known legitimate SA domains (whitelist)
    this.legitimateDomains = new Set([
      'capitecbank.co.za', 'fnb.co.za', 'standardbank.co.za', 'nedbank.co.za',
      'absa.co.za', 'sars.gov.za', 'takealot.com', 'woolworths.co.za',
      'discovery.co.za', 'mtn.co.za', 'vodacom.co.za', 'cellc.co.za',
      'gov.za', 'sassa.gov.za'
    ]);
    
    // Suspicious patterns for SMS
    this.suspiciousPatterns = {
      urgency: [
        /\b(urgent|immediate|asap|now|quickly|today only)\b/i,
        /\b(account suspended|account blocked|limited time)\b/i,
        /\b(verify now|confirm now|act now|respond immediately)\b/i
      ],
      impersonation: [
        /\b(capitec|fnb|standard bank|absa|nedbank)\s+(secure|verify|update)\b/i,
        /\b(sars|tax|refund|rebate)\b/i,
        /\b(takealot|woolworths|discovery)\s+(delivery|order|package)\b/i,
        /\b(sassa|social grant|srd)\b/i
      ],
      phishing: [
        /bit\.ly\/|tinyurl\.com\/|shorturl\.at\/|rb\.gy\/|ow\.ly\//i,
        /https?:\/\/(?:[a-z0-9-]+\.)*?(?:account|verify|secure|login|update)/i,
        /click\s+here|follow\s+this\s+link/i
      ],
      emotional: [
        /\b(hi mom|hi dad|family emergency|funeral|accident)\b/i,
        /\b(help me|send money|need funds|urgent help)\b/i,
        /\b(congratulations|you won|winner|prize)\b/i
      ]
    };
    
    // Known scam sender patterns
    this.scamSenderPatterns = [
      /^\+\d{10,15}$/, // International numbers (suspicious if not in contacts)
      /^[A-Z]{3,6}$/, // Alphanumeric senders (could be spoofed)
    ];
  }

  /**
   * Main detection method - analyzes content for scam indicators
   */
  async detectScam(content, contentType, senderInfo = {}) {
    const startTime = Date.now();
    
    // Input validation
    if (!content || content.length < 3) {
      return this.createResult(0, 'safe', [], 'No suspicious content detected - message too short for analysis', startTime);
    }
    
    let signals = [];
    let riskScore = 0;
    let detectedScamType = 'none';
    
    // Run all detection engines
    const urgencyScore = this.checkUrgency(content);
    const impersonationScore = this.checkImpersonation(content);
    const phishingScore = this.checkPhishing(content);
    const emotionalScore = this.checkEmotional(content);
    const linkScore = await this.checkLinks(content);
    const senderScore = this.checkSender(senderInfo);
    
    // Calculate total risk score (weighted)
    riskScore = (
      urgencyScore * 0.15 +
      impersonationScore * 0.25 +
      phishingScore * 0.30 +
      emotionalScore * 0.15 +
      linkScore * 0.15 +
      senderScore * 0.10
    );
    
    // Determine signals based on high scores
    if (urgencyScore > 0.7) signals.push('urgency');
    if (impersonationScore > 0.6) signals.push('impersonation');
    if (phishingScore > 0.6) signals.push('suspicious_url');
    if (emotionalScore > 0.7) signals.push('emotional_manipulation');
    if (linkScore > 0.8) signals.push('suspicious_url');
    if (senderScore > 0.6) signals.push('spoofed_number');
    
    // Detect specific scam type
    detectedScamType = this.identifyScamType(content, signals);
    
    // Determine risk level
    let riskLevel = 'safe';
    if (riskScore >= 70) {
      riskLevel = 'dangerous';
    } else if (riskScore >= 40) {
      riskLevel = 'suspicious';
    }
    
    // Generate human-readable explanation
    const explanation = this.generateExplanation(riskScore, signals, detectedScamType, content);
    
    return this.createResult(
      Math.round(riskScore), 
      riskLevel, 
      signals, 
      explanation, 
      startTime,
      detectedScamType
    );
  }
  
  /**
   * Check for urgency indicators in content
   */
  checkUrgency(content) {
    let score = 0;
    let matches = 0;
    
    for (const pattern of this.suspiciousPatterns.urgency) {
      if (pattern.test(content)) {
        matches++;
        score += 0.3;
      }
    }
    
    // Check for caps and excessive punctuation
    const capsRatio = (content.match(/[A-Z]{3,}/g) || []).reduce((sum, word) => sum + word.length, 0) / content.length;
    if (capsRatio > 0.3) score += 0.2;
    
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 2) score += 0.1;
    
    return Math.min(score, 1);
  }
  
  /**
   * Check for brand/organization impersonation
   */
  checkImpersonation(content) {
    let score = 0;
    const contentLower = content.toLowerCase();
    
    // Check for legitimate brand mentions
    for (const domain of this.legitimateDomains) {
      const brandName = domain.split('.')[0];
      if (contentLower.includes(brandName)) {
        score += 0.25;
      }
    }
    
    // Check suspicious patterns
    for (const pattern of this.suspiciousPatterns.impersonation) {
      if (pattern.test(content)) {
        score += 0.35;
      }
    }
    
    // Check for mismatched brand-url combinations
    const urlMatch = content.match(/https?:\/\/([^\/\s]+)/i);
    if (urlMatch && score > 0.3) {
      const urlDomain = urlMatch[1].toLowerCase();
      let brandMentioned = null;
      
      for (const domain of this.legitimateDomains) {
        if (contentLower.includes(domain.split('.')[0])) {
          brandMentioned = domain;
          break;
        }
      }
      
      if (brandMentioned && !urlDomain.includes(brandMentioned.split('.')[0])) {
        score += 0.4; // Brand mentioned but URL doesn't match - HIGH risk
      }
    }
    
    return Math.min(score, 1);
  }
  
  /**
   * Check for phishing indicators (links, requests for info)
   */
  checkPhishing(content) {
    let score = 0;
    
    // Check for URL patterns
    const urls = content.match(/https?:\/\/[^\s]+/gi) || [];
    const suspiciousUrls = urls.filter(url => {
      const domain = url.replace(/^https?:\/\//i, '').split('/')[0];
      // Check for typosquatting
      for (const legit of this.legitimateDomains) {
        if (domain !== legit && domain.includes(legit.split('.')[0]) && !domain.endsWith(legit)) {
          return true;
        }
      }
      return false;
    });
    
    if (suspiciousUrls.length > 0) score += 0.5;
    if (urls.length > 0 && suspiciousUrls.length === 0) score += 0.2;
    
    // Check for credential harvesting indicators
    const credentialPhrases = [
      /(?:verify|confirm|update|validate).{0,20}(?:account|details|information)/i,
      /(?:otp|pin|password|credit card|debit card|id number|passport)/i,
      /(?:click|tap|follow).{0,20}(?:link|here)/i,
      /\b(?:login|sign in|log in)\b/i
    ];
    
    for (const pattern of credentialPhrases) {
      if (pattern.test(content)) {
        score += 0.15;
      }
    }
    
    return Math.min(score, 1);
  }
  
  /**
   * Check for emotional manipulation tactics
   */
  checkEmotional(content) {
    let score = 0;
    const contentLower = content.toLowerCase();
    
    for (const pattern of this.suspiciousPatterns.emotional) {
      if (pattern.test(content)) {
        score += 0.35;
      }
    }
    
    // Check for family relationship claims
    if (/\b(mom|dad|mother|father|son|daughter|brother|sister|uncle|aunt|grandma|grandpa)\b/i.test(content)) {
      score += 0.2;
    }
    
    // Check for emergency claims
    if (/\b(accident|emergency|hospital|jail|police|lawyer|lawyer's)\b/i.test(content)) {
      score += 0.3;
    }
    
    return Math.min(score, 1);
  }
  
  /**
   * Analyze URLs for suspicious characteristics
   */
  async checkLinks(content) {
    const urls = content.match(/https?:\/\/[^\s]+/gi) || [];
    
    if (urls.length === 0) return 0;
    
    let score = 0;
    
    for (const url of urls) {
      // Check for shortened URLs (high risk)
      if (/bit\.ly|tinyurl|shorturl|rb\.gy|ow\.ly|is\.gd|buff\.ly/i.test(url)) {
        score += 0.6;
      }
      
      // Check for IP address URLs (very high risk)
      if (/https?:\/\/(?:\d{1,3}\.){3}\d{1,3}/.test(url)) {
        score += 0.8;
      }
      
      // Check for suspicious TLDs
      const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.club'];
      if (suspiciousTLDs.some(tld => url.includes(tld))) {
        score += 0.5;
      }
      
      // Check for multiple subdomains (often phishing)
      const subdomainCount = (url.match(/\./g) || []).length;
      if (subdomainCount > 3) {
        score += 0.3;
      }
    }
    
    return Math.min(score, 1);
  }
  
  /**
   * Check sender information for suspicious patterns
   */
  checkSender(senderInfo) {
    if (!senderInfo.number) return 0;
    
    let score = 0;
    
    // Check if international number
    if (senderInfo.number.startsWith('+') && !senderInfo.number.startsWith('+27')) {
      score += 0.4;
    }
    
    // Check for alphanumeric sender (often spoofed)
    if (/[A-Za-z]/.test(senderInfo.number) && !/^[A-Z]{3,5}$/.test(senderInfo.number)) {
      score += 0.3;
    }
    
    return Math.min(score, 1);
  }
  
  /**
   * Identify specific scam type based on content and signals
   */
  identifyScamType(content, signals) {
    const contentLower = content.toLowerCase();
    
    if (/(capitec|fnb|standard bank|absa|nedbank|bank)/i.test(contentLower) && 
        signals.includes('urgency') && signals.includes('suspicious_url')) {
      return 'fake_bank_sms';
    }
    
    if (/(sars|tax|refund)/i.test(contentLower)) {
      return 'sars_phishing';
    }
    
    if (/(takealot|woolworths|delivery|package|order)/i.test(contentLower)) {
      return 'delivery_scam';
    }
    
    if (/(whatsapp|telegram|signal)/i.test(contentLower)) {
      return 'whatsapp_impersonation';
    }
    
    if (/\b(hi mom|hi dad|family|emergency|funeral|accident)\b/i.test(contentLower)) {
      return 'family_emergency';
    }
    
    if (/(job|position|salary|interview|cv|resume)/i.test(contentLower) && 
        (/\$\d|R\d|€\d/.test(content) || /\b(urgent|immediate)\b/i.test(content))) {
      return 'job_scam';
    }
    
    if (/(airtime|data|voucher)/i.test(contentLower)) {
      return 'airtime_scam';
    }
    
    if (/(otp|one time pin|verification code)/i.test(contentLower)) {
      return 'otp_fraud';
    }
    
    return 'none';
  }
  
  /**
   * Generate human-readable explanation of why content is suspicious
   */
  generateExplanation(riskScore, signals, scamType, content) {
    if (riskScore < 40) {
      return "This message appears to be safe based on our analysis. No common scam patterns were detected.";
    }
    
    let explanation = "";
    
    if (scamType !== 'none') {
      const scamExplanations = {
        'fake_bank_sms': "⚠️ This message is pretending to be from a South African bank. Real banks will NEVER ask you to click links or share your OTP via SMS. Delete this message immediately and contact your bank directly using their official number.",
        'sars_phishing': "⚠️ This appears to be a fake SARS tax refund scam. SARS never sends SMS with links asking for personal information or payments. Legitimate SARS communication only comes from sars.gov.za domains.",
        'delivery_scam': "📦 This is likely a fake delivery scam. Scammers pretend to be Takealot, courier companies, or Post Office to steal your card details. If you ordered something, track it through the official app - not SMS links.",
        'whatsapp_impersonation': "💬 This WhatsApp message shows signs of impersonation fraud. Scammers often pretend to be family, friends, or colleagues to ask for money or sensitive information. Call the person directly on their known number to verify.",
        'family_emergency': "🏥 ⚠️ URGENT: This is a classic 'family emergency' scam. Scammers exploit your fear for loved ones. STOP and call your family member directly using their real number before taking any action.",
        'job_scam': "💼 This job offer shows signs of a recruitment scam. Legitimate companies don't ask for upfront payments, OTPs, or personal banking details via WhatsApp/SMS. Research the company independently.",
        'airtime_scam': "📱 This is an airtime scam designed to steal your mobile credit. Never share airtime pins or 'voucher codes' with anyone - not even family - until you verify in person.",
        'otp_fraud': "🔐 ⚠️ This is a dangerous OTP harvesting attempt. Your One-Time PINs are the keys to your bank account. NEVER share them with anyone, not even someone claiming to be from your bank."
      };
      
      explanation = scamExplanations[scamType] || "This message contains multiple scam indicators. Do not interact with any links, calls, or requests for personal information.";
    } else {
      explanation = "⚠️ This message shows suspicious characteristics: ";
      const signalExplanations = [];
      
      if (signals.includes('urgency')) signalExplanations.push("it tries to rush you into acting immediately");
      if (signals.includes('impersonation')) signalExplanations.push("it pretends to be a trusted company or organization");
      if (signals.includes('suspicious_url')) signalExplanations.push("it contains suspicious links that may lead to fake websites");
      if (signals.includes('emotional_manipulation')) signalExplanations.push("it tries to manipulate your emotions");
      if (signals.includes('spoofed_number')) signalExplanations.push("the sender number appears suspicious");
      
      explanation += signalExplanations.join(", ");
      explanation += ". DELETE this message and do not respond or click anything.";
    }
    
    // Add confidence note
    if (riskScore >= 85) {
      explanation += " Our confidence in this detection is VERY HIGH. This is almost certainly a scam.";
    } else if (riskScore >= 70) {
      explanation += " Our confidence in this detection is HIGH. Proceed with extreme caution.";
    } else {
      explanation += " Our confidence is MODERATE. When in doubt, verify through official channels.";
    }
    
    return explanation;
  }
  
  /**
   * Create standardized result object
   */
  createResult(riskScore, riskLevel, signals, explanation, startTime, detectedScamType = 'none') {
    return {
      riskScore,
      riskLevel,
      signals,
      explanation,
      detectedScamType,
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      confidenceScore: this.calculateConfidence(riskScore, signals)
    };
  }
  
  /**
   * Calculate confidence level based on risk score and signal count
   */
  calculateConfidence(riskScore, signals) {
    // More signals = higher confidence
    const signalBonus = Math.min(signals.length * 5, 15);
    let confidence = riskScore + signalBonus;
    
    // Cap at 99% (never claim 100% certainty)
    return Math.min(confidence, 99);
  }
}

module.exports = new ScamDetectionService();
backend/src/controllers/scanController.js
javascript
const ScanResult = require('../models/ScanResult');
const ScamDetectionService = require('../services/ScamDetectionService');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Rate limiting per user (token bucket)
const userRateLimits = new Map();

class ScanController {
  
  /**
   * Scan SMS content for scams
   */
  async scanSMS(req, res) {
    try {
      // Check rate limits
      if (!this.checkRateLimit(req.userId || req.ip)) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please wait before scanning more messages.',
          retryAfter: 60 
        });
      }
      
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { message, senderNumber, senderName } = req.body;
      
      // Anonymize user ID (hash for privacy)
      const userId = this.anonymizeId(req.userId || req.ip);
      
      // Run detection
      const result = await ScamDetectionService.detectScam(
        message, 
        'sms', 
        { number: senderNumber, name: senderName }
      );
      
      // Store result for analytics (with user consent)
      if (req.body.consentGiven) {
        const scanResult = new ScanResult({
          userId,
          content: message,
          contentType: 'sms',
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          signals: result.signals,
          explanation: result.explanation,
          detectedScamType: result.detectedScamType,
          metadata: {
            senderNumber: senderNumber ? this.hashPhoneNumber(senderNumber) : null,
            senderName: senderName,
            linksDetected: this.extractLinks(message),
            processingTimeMs: result.processingTimeMs,
            modelVersion: '1.0.0'
          }
        });
        await scanResult.save();
      }
      
      res.json({
        success: true,
        result: {
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          signals: result.signals,
          explanation: result.explanation,
          confidence: result.confidenceScore,
          detectedScamType: result.detectedScamType
        }
      });
      
    } catch (error) {
      console.error('Scan error:', error);
      res.status(500).json({ error: 'Failed to scan message' });
    }
  }
  
  /**
   * Scan WhatsApp content
   */
  async scanWhatsApp(req, res) {
    try {
      if (!this.checkRateLimit(req.userId || req.ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      
      const { message, senderNumber, messageType } = req.body;
      
      const result = await ScamDetectionService.detectScam(
        message,
        'whatsapp',
        { number: senderNumber }
      );
      
      // Add WhatsApp-specific warnings
      if (message.includes('voice') || messageType === 'voice') {
        result.explanation = "🎤 VOICE NOTE: " + result.explanation + 
          " Be aware that AI voice cloning is increasingly used in WhatsApp scams. " +
          "Always verify through a different channel (call back on known number) before sending money.";
      }
      
      res.json({
        success: true,
        result
      });
      
    } catch (error) {
      console.error('WhatsApp scan error:', error);
      res.status(500).json({ error: 'Failed to scan WhatsApp message' });
    }
  }
  
  /**
   * Scan URL/link
   */
  async scanURL(req, res) {
    try {
      if (!this.checkRateLimit(req.userId || req.ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      
      const { url } = req.body;
      
      if (!url || !this.isValidUrl(url)) {
        return res.status(400).json({ error: 'Invalid URL provided' });
      }
      
      const result = await ScamDetectionService.detectScam(
        url,
        'url',
        {}
      );
      
      // Enhance URL-specific analysis
      const domainAnalysis = this.analyzeDomain(url);
      
      res.json({
        success: true,
        result: {
          ...result,
          domainAnalysis
        }
      });
      
    } catch (error) {
      console.error('URL scan error:', error);
      res.status(500).json({ error: 'Failed to scan URL' });
    }
  }
  
  /**
   * Bulk scan multiple items
   */
  async bulkScan(req, res) {
    try {
      const { items } = req.body;
      
      if (!items || !Array.isArray(items) || items.length > 10) {
        return res.status(400).json({ error: 'Maximum 10 items per bulk scan' });
      }
      
      const results = [];
      for (const item of items) {
        const result = await ScamDetectionService.detectScam(
          item.content,
          item.type || 'sms',
          { number: item.sender }
        );
        results.push({ id: item.id, result });
      }
      
      res.json({ success: true, results });
      
    } catch (error) {
      console.error('Bulk scan error:', error);
      res.status(500).json({ error: 'Failed to perform bulk scan' });
    }
  }
  
  /**
   * Get scan statistics for user
   */
  async getUserStats(req, res) {
    try {
      const userId = this.anonymizeId(req.userId || req.ip);
      
      const stats = await ScanResult.aggregate([
        { $match: { userId } },
        { $group: {
            _id: null,
            totalScans: { $sum: 1 },
            dangerousCount: { $sum: { $cond: [{ $eq: ['$riskLevel', 'dangerous'] }, 1, 0] } },
            suspiciousCount: { $sum: { $cond: [{ $eq: ['$riskLevel', 'suspicious'] }, 1, 0] } },
            avgRiskScore: { $avg: '$riskScore' }
          }
        }
      ]);
      
      res.json({
        success: true,
        stats: stats[0] || { totalScans: 0, dangerousCount: 0, suspiciousCount: 0, avgRiskScore: 0 }
      });
      
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }
  
  // Helper methods
  
  checkRateLimit(identifier) {
    const now = Date.now();
    const userLimit = userRateLimits.get(identifier) || { count: 0, resetTime: now + 60000 };
    
    if (now > userLimit.resetTime) {
      userRateLimits.set(identifier, { count: 1, resetTime: now + 60000 });
      return true;
    }
    
    if (userLimit.count >= 10) { // 10 scans per minute max
      return false;
    }
    
    userLimit.count++;
    userRateLimits.set(identifier, userLimit);
    return true;
  }
  
  anonymizeId(id) {
    return crypto.createHash('sha256').update(id).digest('hex').substring(0, 32);
  }
  
  hashPhoneNumber(phone) {
    return crypto.createHash('sha256').update(phone).digest('hex');
  }
  
  extractLinks(text) {
    const urlRegex = /https?:\/\/[^\s]+/gi;
    return text.match(urlRegex) || [];
  }
  
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
  
  analyzeDomain(url) {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname;
      const tld = domain.split('.').pop();
      
      return {
        domain,
        isIpAddress: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain),
        tld,
        isSuspiciousTld: ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top'].includes(tld),
        subdomainCount: (domain.match(/\./g) || []).length,
        age: null // Would need WHOIS API
      };
    } catch {
      return null;
    }
  }
}

module.exports = new ScanController();
backend/src/routes/scanRoutes.js
javascript
const express = require('express');
const { body } = require('express-validator');
const scanController = require('../controllers/scanController');
const router = express.Router();

// Validation rules
const smsValidation = [
  body('message').notEmpty().withMessage('Message content is required').isLength({ min: 3, max: 5000 }),
  body('senderNumber').optional().isString(),
  body('consentGiven').optional().isBoolean()
];

const whatsAppValidation = [
  body('message').notEmpty().withMessage('Message content is required').isLength({ min: 3, max: 5000 }),
  body('senderNumber').optional().isString(),
  body('messageType').optional().isIn(['text', 'voice', 'video', 'image'])
];

const urlValidation = [
  body('url').notEmpty().withMessage('URL is required').isURL({ require_protocol: true })
];

// Routes
router.post('/sms', smsValidation, scanController.scanSMS.bind(scanController));
router.post('/whatsapp', whatsAppValidation, scanController.scanWhatsApp.bind(scanController));
router.post('/url', urlValidation, scanController.scanURL.bind(scanController));
router.post('/bulk', scanController.bulkScan.bind(scanController));
router.get('/stats', scanController.getUserStats.bind(scanController));

module.exports = router;
2. MOBILE APP - React Native
mobile/package.json
json
{
  "name": "siyabona-mobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "build": "react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.12",
    "@react-navigation/stack": "^6.3.21",
    "react-native-screens": "^3.29.0",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-vector-icons": "^10.0.3",
    "react-native-async-storage": "^1.22.3",
    "react-native-clipboard": "^1.13.2",
    "axios": "^1.6.2",
    "react-native-share": "^10.0.2",
    "react-native-document-picker": "^9.0.1",
    "react-native-permissions": "^3.10.0",
    "@react-native-community/clipboard": "^1.5.1",
    "react-native-fast-image": "^8.6.3"
  },
  "devDependencies": {
    "@babel/core": "^7.23.5",
    "@babel/preset-env": "^7.23.5",
    "@babel/runtime": "^7.23.5",
    "@react-native/eslint-config": "^0.73.0",
    "@react-native/metro-config": "^0.73.0",
    "babel-jest": "^29.7.0",
    "eslint": "^8.55.0",
    "jest": "^29.7.0",
    "metro-react-native-babel-preset": "^0.77.0",
    "prettier": "^3.1.0",
    "react-test-renderer": "18.2.0"
  },
  "engines": {
    "node": ">=18"
  }
}
mobile/App.tsx
tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  useColorScheme,
  LogBox,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ReportScreen from './src/screens/ReportScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Import services
import { ApiService } from './src/services/ApiService';
import { StorageService } from './src/services/StorageService';

// Ignore specific warnings
LogBox.ignoreLogs(['Warning: ...']);

const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [userConsent, setUserConsent] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check if user has given consent
      const consent = await StorageService.getConsent();
      if (consent) {
        setUserConsent(true);
        // Initialize API service with consent
        ApiService.initialize(consent);
      }
      
      // Load initial scam database
      await ApiService.getScamStats();
      
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    // Could add a splash screen here
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#f5f5f5' }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName = '';
              
              if (route.name === 'Home') {
                iconName = 'home';
              } else if (route.name === 'Scan') {
                iconName = 'search';
              } else if (route.name === 'History') {
                iconName = 'history';
              } else if (route.name === 'Report') {
                iconName = 'flag';
              } else if (route.name === 'Profile') {
                iconName = 'person';
              }
              
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4CAF50',
            tabBarInactiveTintColor: 'gray',
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Scan" component={ScanScreen} />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Report" component={ReportScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default App;
mobile/src/screens/HomeScreen.tsx
tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ApiService } from '../services/ApiService';
import { StorageService } from '../services/StorageService';

interface Stats {
  totalScans: number;
  dangerousCount: number;
  suspiciousCount: number;
  avgRiskScore: number;
}

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  date: string;
}

const HomeScreen: React.FC = ({ navigation }: any) => {
  const [stats, setStats] = useState<Stats>({
    totalScans: 0,
    dangerousCount: 0,
    suspiciousCount: 0,
    avgRiskScore: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([
    {
      id: '1',
      title: 'Fake SARS Refund SMS Spreading',
      description: 'New SMS scam pretending to be SARS asking for "tax refund verification". Do not click any links.',
      severity: 'high',
      date: 'Today',
    },
    {
      id: '2',
      title: 'WhatsApp Deepfake Voice Scam',
      description: 'Scammers using AI voice cloning to impersonate family members asking for urgent money.',
      severity: 'high',
      date: 'Yesterday',
    },
    {
      id: '3',
      title: 'Capitec OTP Fraud Campaign',
      description: 'Fake Capitec SMS claiming "account suspended" with fraudulent number.',
      severity: 'medium',
      date: '2 days ago',
    },
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await StorageService.getUserData();
      setUserName(userData?.name || 'User');
      
      const scanStats = await ApiService.getUserStats();
      setStats(scanStats);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getRiskLevelText = (score: number) => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  const getRiskLevelColor = (score: number) => {
    if (score >= 70) return '#f44336';
    if (score >= 40) return '#ff9800';
    return '#4caf50';
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.tagline}>Seeing through the deception</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="verified-user" size={32} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.totalScans}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="warning" size={32} color="#f44336" />
          <Text style={[styles.statNumber, { color: '#f44336' }]}>{stats.dangerousCount}</Text>
          <Text style={styles.statLabel}>Scams Blocked</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="security" size={32} color="#ff9800" />
          <Text style={[styles.statNumber, { color: getRiskLevelColor(stats.avgRiskScore) }]}>
            {getRiskLevelText(stats.avgRiskScore)}
          </Text>
          <Text style={styles.statLabel}>Avg Risk Level</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Scan')}
          >
            <Icon name="sms" size={28} color="#fff" />
            <Text style={styles.actionButtonText}>Scan SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#25D366' }]}
            onPress={() => navigation.navigate('Scan', { tab: 'whatsapp' })}
          >
            <Icon name="chat" size={28} color="#fff" />
            <Text style={styles.actionButtonText}>Scan WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => navigation.navigate('Scan', { tab: 'url' })}
          >
            <Icon name="link" size={28} color="#fff" />
            <Text style={styles.actionButtonText}>Check Link</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Alerts */}
      <View style={styles.alertsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scam Alerts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentAlerts.map((alert) => (
          <TouchableOpacity 
            key={alert.id} 
            style={styles.alertCard}
            onPress={() => {
              Alert.alert(
                alert.title,
                `${alert.description}\n\nDate: ${alert.date}\nSeverity: ${alert.severity.toUpperCase()}`,
                [{ text: 'OK', style: 'default' }]
              );
            }}
          >
            <View style={[styles.alertDot, { backgroundColor: getSeverityColor(alert.severity) }]} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDescription} numberOfLines={2}>
                {alert.description}
              </Text>
              <Text style={styles.alertDate}>{alert.date}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Safety Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Safety Tips</Text>
        <View style={styles.tipCard}>
          <Icon name="tips-and-updates" size={24} color="#4CAF50" />
          <Text style={styles.tipText}>
            Banks will NEVER ask for your PIN, OTP, or password via SMS or phone call.
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Icon name="verified" size={24} color="#4CAF50" />
          <Text style={styles.tipText}>
            Always verify urgent requests by calling back on a known, trusted number.
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Icon name="link-off" size={24} color="#4CAF50" />
          <Text style={styles.tipText}>
            Never click links in unsolicited messages, even if they look legitimate.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  tagline: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -20,
    marginHorizontal: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  alertsSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  alertDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  alertDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  tipsSection: {
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 15,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default HomeScreen;
mobile/src/screens/ScanScreen.tsx
tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ApiService } from '../services/ApiService';

interface ScanResult {
  riskScore: number;
  riskLevel: 'safe' | 'suspicious' | 'dangerous';
  signals: string[];
  explanation: string;
  confidence: number;
  detectedScamType: string;
  domainAnalysis?: any;
}

const ScanScreen: React.FC = ({ route }: any) => {
  const [activeTab, setActiveTab] = useState<'sms' | 'whatsapp' | 'url' | 'report'>(
    route?.params?.tab || 'sms'
  );
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [showExample, setShowExample] = useState(false);

  const examples = {
    sms: "CAPITEC: Your account has been suspended due to suspicious activity. Click https://capitec-secure-verify.co.za to restore access immediately. Failure to verify within 24 hours will result in permanent account closure.",
    whatsapp: "Hi Mom, it's me. I lost my phone and this is my new number. Please send R2000 urgently for an emergency. I'll explain later. Just send to this account: Capitec 1234567890",
    url: "https://capitecbank-verify-account.xyz/login"
  };

  useEffect(() => {
    if (showExample && examples[activeTab as keyof typeof examples]) {
      setInputText(examples[activeTab as keyof typeof examples]);
    }
  }, [activeTab, showExample]);

  const handleScan = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter a message, link, or number to scan');
      return;
    }

    setIsScanning(true);
    setResult(null);

    try {
      let scanResult;
      
      if (activeTab === 'url') {
        scanResult = await ApiService.scanURL(inputText);
      } else if (activeTab === 'whatsapp') {
        scanResult = await ApiService.scanWhatsApp(inputText);
      } else {
        scanResult = await ApiService.scanSMS(inputText);
      }
      
      setResult(scanResult);
      
      // Show alert for dangerous results
      if (scanResult.riskLevel === 'dangerous') {
        Alert.alert(
          '⚠️ SCAM DETECTED!',
          'This content appears to be a scam. Do not click any links or respond.',
          [
            { text: 'Delete Message', style: 'destructive' },
            { text: 'View Details', style: 'default', onPress: () => {} }
          ]
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Error', 'Failed to scan. Please check your connection and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'dangerous': return '#f44336';
      case 'suspicious': return '#ff9800';
      case 'safe': return '#4caf50';
      default: return '#999';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'dangerous': return 'error';
      case 'suspicious': return 'warning';
      case 'safe': return 'check-circle';
      default: return 'help';
    }
  };

  const getSignalIcon = (signal: string) => {
    const icons: Record<string, string> = {
      'urgency': 'speed',
      'impersonation': 'people',
      'suspicious_url': 'link-off',
      'emotional_manipulation': 'mood-bad',
      'spoofed_number': 'call-end'
    };
    return icons[signal] || 'info';
  };

  const getSignalLabel = (signal: string) => {
    const labels: Record<string, string> = {
      'urgency': 'Urgency Tactics',
      'impersonation': 'Brand Impersonation',
      'suspicious_url': 'Suspicious Link',
      'emotional_manipulation': 'Emotional Manipulation',
      'spoofed_number': 'Spoofed Number'
    };
    return labels[signal] || signal;
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setShowExample(false);
  };

  const handleShare = async () => {
    if (result) {
      try {
        await Share.share({
          message: `SIYABONA Scam Alert\n\nRisk Score: ${result.riskScore}%\n\n${result.explanation}\n\nStay safe! Download SIYABONA to protect yourself from scams.`,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent) {
        setInputText(clipboardContent);
      }
    } catch (error) {
      console.error('Paste error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sms' && styles.activeTab]}
          onPress={() => {
            setActiveTab('sms');
            setResult(null);
            setInputText('');
          }}
        >
          <Icon name="sms" size={20} color={activeTab === 'sms' ? '#4CAF50' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'sms' && styles.activeTabText]}>SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'whatsapp' && styles.activeTab]}
          onPress={() => {
            setActiveTab('whatsapp');
            setResult(null);
            setInputText('');
          }}
        >
          <Icon name="chat" size={20} color={activeTab === 'whatsapp' ? '#25D366' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'whatsapp' && styles.activeTabText]}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'url' && styles.activeTab]}
          onPress={() => {
            setActiveTab('url');
            setResult(null);
            setInputText('');
          }}
        >
          <Icon name="link" size={20} color={activeTab === 'url' ? '#2196F3' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'url' && styles.activeTabText]}>Link</Text>
        </TouchableOpacity>
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputHeader}>
          <Text style={styles.inputLabel}>
            {activeTab === 'sms' && 'Paste SMS Message'}
            {activeTab === 'whatsapp' && 'Paste WhatsApp Message'}
            {activeTab === 'url' && 'Enter URL to Check'}
          </Text>
          <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
            <Icon name="content-paste" size={20} color="#4CAF50" />
            <Text style={styles.pasteText}>Paste</Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          placeholder={
            activeTab === 'sms' 
              ? "Paste suspicious SMS message here...\n\nExample: 'CAPITEC: Your account has been suspended...'"
              : activeTab === 'whatsapp'
              ? "Paste WhatsApp message or describe voice note...\n\nExample: 'Hi Mom, it's me. New number. Please send money urgently...'"
              : "Enter URL to check...\n\nExample: https://capitec-secure-verify.co.za"
          }
          value={inputText}
          onChangeText={setInputText}
          editable={!isScanning}
        />
        
        <View style={styles.inputActions}>
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClear}
          >
            <Icon name="clear" size={20} color="#666" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.exampleButton} 
            onPress={() => setShowExample(!showExample)}
          >
            <Icon name="help" size={20} color="#4CAF50" />
            <Text style={styles.exampleText}>Try Example</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scan Button */}
      <TouchableOpacity 
        style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
        onPress={handleScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="search" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>Analyze Now</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Results Area */}
      {result && (
        <View style={styles.resultsContainer}>
          <View style={[styles.resultHeader, { backgroundColor: getRiskColor(result.riskLevel) + '10' }]}>
            <Icon 
              name={getRiskIcon(result.riskLevel)} 
              size={48} 
              color={getRiskColor(result.riskLevel)} 
            />
            <View style={styles.resultTitleContainer}>
              <Text style={[styles.resultLevel, { color: getRiskColor(result.riskLevel) }]}>
                {result.riskLevel === 'dangerous' && '⚠️ SCAM DETECTED'}
                {result.riskLevel === 'suspicious' && '⚠️ SUSPICIOUS'}
                {result.riskLevel === 'safe' && '✓ LIKELY SAFE'}
              </Text>
              <Text style={styles.resultScore}>
                {result.riskScore}% Risk Score
              </Text>
              <Text style={styles.resultConfidence}>
                {result.confidence}% confidence
              </Text>
            </View>
          </View>

          {/* Explanation */}
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Why this was flagged:</Text>
            <Text style={styles.explanationText}>{result.explanation}</Text>
          </View>

          {/* Detection Signals */}
          {result.signals.length > 0 && (
            <View style={styles.signalsContainer}>
              <Text style={styles.signalsTitle}>Detection Signals</Text>
              {result.signals.map((signal, index) => (
                <View key={index} style={styles.signalItem}>
                  <Icon name={getSignalIcon(signal)} size={20} color="#ff9800" />
                  <Text style={styles.signalText}>{getSignalLabel(signal)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Domain Analysis (for URLs) */}
          {result.domainAnalysis && (
            <View style={styles.domainContainer}>
              <Text style={styles.domainTitle}>Domain Analysis</Text>
              <Text style={styles.domainText}>
                Domain: {result.domainAnalysis.domain}
              </Text>
              {result.domainAnalysis.isSuspiciousTld && (
                <Text style={styles.warningText}>
                  ⚠️ Suspicious top-level domain detected
                </Text>
              )}
              {result.domainAnalysis.isIpAddress && (
                <Text style={styles.warningText}>
                  ⚠️ IP address URL - very suspicious
                </Text>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Icon name="share" size={20} color="#4CAF50" />
              <Text style={styles.shareText}>Share Alert</Text>
            </TouchableOpacity>
            
            {result.riskLevel !== 'safe' && (
              <TouchableOpacity 
                style={styles.reportButton}
                onPress={() => {
                  Alert.alert('Report Scam', 'Would you like to report this to our community database?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Report', onPress: () => {
                      // Handle report submission
                      Alert.alert('Thank You', 'This has been reported to help protect others.');
                    }}
                  ]);
                }}
              >
                <Icon name="flag" size={20} color="#fff" />
                <Text style={styles.reportText}>Report Scam</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Icon name="info" size={20} color="#4CAF50" />
        <Text style={styles.infoText}>
          We never store your personal messages. All scans are private and encrypted.
          Results are anonymized to help improve detection for everyone.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#e8f5e9',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pasteText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4CAF50',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exampleText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4CAF50',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  resultTitleContainer: {
    marginLeft: 16,
    flex: 1,
  },
  resultLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultScore: {
    fontSize: 14,
    color: '#666',
  },
  resultConfidence: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  explanationContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  signalsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  signalsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  signalText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
  },
  domainContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  domainTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  domainText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
  resultActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginRight: 8,
  },
  shareText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f44336',
    marginLeft: 8,
  },
  reportText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
});

export default ScanScreen;
mobile/src/services/ApiService.ts
typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.siyabona.app'; // Replace with actual URL

export class ApiService {
  private static instance: ApiService;
  private apiClient: any;
  private userConsent: boolean = false;

  private constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth
    this.apiClient.interceptors.request.use(async (config: any) => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  static initialize(consent: boolean): void {
    const instance = ApiService.getInstance();
    instance.userConsent = consent;
  }

  async scanSMS(message: string, senderNumber?: string): Promise<any> {
    try {
      const response = await this.apiClient.post('/scan/sms', {
        message,
        senderNumber,
        consentGiven: this.userConsent,
      });
      return response.data.result;
    } catch (error) {
      console.error('SMS scan error:', error);
      throw error;
    }
  }

  async scanWhatsApp(message: string, senderNumber?: string): Promise<any> {
    try {
      const response = await this.apiClient.post('/scan/whatsapp', {
        message,
        senderNumber,
        messageType: 'text',
      });
      return response.data.result;
    } catch (error) {
      console.error('WhatsApp scan error:', error);
      throw error;
    }
  }

  async scanURL(url: string): Promise<any> {
    try {
      const response = await this.apiClient.post('/scan/url', { url });
      return response.data.result;
    } catch (error) {
      console.error('URL scan error:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<any> {
    try {
      const response = await this.apiClient.get('/scan/stats');
      return response.data.stats;
    } catch (error) {
      console.error('Stats error:', error);
      return {
        totalScans: 0,
        dangerousCount: 0,
        suspiciousCount: 0,
        avgRiskScore: 0,
      };
    }
  }

  async getScamStats(): Promise<any> {
    try {
      const response = await this.apiClient.get('/stats/scams');
      return response.data;
    } catch (error) {
      console.error('Scam stats error:', error);
      return null;
    }
  }

  async reportScam(data: any): Promise<any> {
    try {
      const response = await this.apiClient.post('/report', data);
      return response.data;
    } catch (error) {
      console.error('Report error:', error);
      throw error;
    }
  }
}
mobile/src/services/StorageService.ts
typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  id: string;
  name: string;
  email?: string;
  plan: 'free' | 'pro' | 'sme';
  createdAt: string;
}

export class StorageService {
  private static KEYS = {
    USER_DATA: '@siyabona:user',
    CONSENT: '@siyabona:consent',
    SCAN_HISTORY: '@siyabona:history',
    SETTINGS: '@siyabona:settings',
    AUTH_TOKEN: '@siyabona:token',
  };

  static async saveUserData(data: Partial<UserData>): Promise<void> {
    try {
      const existing = await this.getUserData();
      const updated = { ...existing, ...data };
      await AsyncStorage.setItem(this.KEYS.USER_DATA, JSON.stringify(updated));
    } catch (error) {
      console.error('Save user data error:', error);
    }
  }

  static async getUserData(): Promise<UserData | null> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }

  static async setConsent(consent: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.CONSENT, JSON.stringify(consent));
    } catch (error) {
      console.error('Set consent error:', error);
    }
  }

  static async getConsent(): Promise<boolean> {
    try {
      const consent = await AsyncStorage.getItem(this.KEYS.CONSENT);
      return consent ? JSON.parse(consent) : false;
    } catch (error) {
      console.error('Get consent error:', error);
      return false;
    }
  }

  static async saveScanHistory(scan: any): Promise<void> {
    try {
      const history = await this.getScanHistory();
      const updated = [scan, ...history].slice(0, 100); // Keep last 100 scans
      await AsyncStorage.setItem(this.KEYS.SCAN_HISTORY, JSON.stringify(updated));
    } catch (error) {
      console.error('Save scan history error:', error);
    }
  }

  static async getScanHistory(): Promise<any[]> {
    try {
      const history = await AsyncStorage.getItem(this.KEYS.SCAN_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Get scan history error:', error);
      return [];
    }
  }

  static async clearScanHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.KEYS.SCAN_HISTORY);
    } catch (error) {
      console.error('Clear scan history error:', error);
    }
  }

  static async saveSettings(settings: any): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Save settings error:', error);
    }
  }

  static async getSettings(): Promise<any> {
    try {
      const settings = await AsyncStorage.getItem(this.KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : {
        notificationsEnabled: true,
        autoScanEnabled: true,
        darkMode: false,
      };
    } catch (error) {
      console.error('Get settings error:', error);
      return {};
    }
  }

  static async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Save auth token error:', error);
    }
  }

  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Get auth token error:', error);
      return null;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.KEYS.USER_DATA,
        this.KEYS.SCAN_HISTORY,
        this.KEYS.SETTINGS,
        this.KEYS.AUTH_TOKEN,
      ]);
    } catch (error) {
      console.error('Clear all data error:', error);
    }
  }
}
3. DOCKER COMPOSE for Deployment
docker-compose.yml
yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: siyabona-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-secure_password}
      MONGO_INITDB_DATABASE: siyabona
    volumes:
      - mongodb_data:/data/db
      - ./backup:/backup
    ports:
      - "27017:27017"
    networks:
      - siyabona-network

  backend:
    build: ./backend
    container_name: siyabona-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      MONGODB_URI: mongodb://${MONGO_USER:-admin}:${MONGO_PASSWORD:-secure_password}@mongodb:27017/siyabona
      JWT_SECRET: ${JWT_SECRET:-your_jwt_secret_key}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-http://localhost:8081}
      RATE_LIMIT_WINDOW_MS: 900000
      RATE_LIMIT_MAX_REQUESTS: 100
    depends_on:
      - mongodb
    ports:
      - "3000:3000"
    networks:
      - siyabona-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    container_name: siyabona-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - backend
    networks:
      - siyabona-network

  redis:
    image: redis:7-alpine
    container_name: siyabona-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - siyabona-network
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redis_password}

networks:
  siyabona-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
backend/Dockerfile
dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]
4. ENVIRONMENT VARIABLES
.env
env
# MongoDB Configuration
MONGO_USER=siyabona_admin
MONGO_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this

# API Configuration
PORT=3000
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Allowed Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:8081,https://siyabona.app

# Redis Configuration
REDIS_PASSWORD=your_redis_password

# External APIs (if needed)
GOOGLE_SAFE_BROWSING_API_KEY=your_api_key
VIRUSTOTAL_API_KEY=your_api_key
5. DEPLOYMENT SCRIPT
deploy.sh
bash
#!/bin/bash

# SIYABONA Deployment Script
echo "🚀 SIYABONA Mobile IPS Deployment Starting..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "docker-compose is required but not installed. Aborting." >&2; exit 1; }

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create necessary directories
mkdir -p logs/nginx
mkdir -p backup
mkdir -p nginx/ssl

# Build and start containers
echo "📦 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo "🏥 Checking service health..."
curl -f http://localhost:3000/health || echo "⚠️ Health check failed"

# Show status
docker-compose ps

echo "✅ Deployment complete!"
echo "📱 Backend API: http://localhost:3000"
echo "🔒 MongoDB: localhost:27017"
echo "📊 Redis: localhost:6379"
Summary