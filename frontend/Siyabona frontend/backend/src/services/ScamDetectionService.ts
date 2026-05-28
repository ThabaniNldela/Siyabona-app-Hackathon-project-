import crypto from 'crypto';

interface SenderInfo {
  number?: string;
  name?: string;
}

interface DetectionResult {
  riskScore: number;
  riskLevel: 'safe' | 'suspicious' | 'dangerous';
  signals: string[];
  explanation: string;
  detectedScamType: string;
  processingTimeMs: number;
  timestamp: string;
  confidenceScore: number;
}

class ScamDetectionService {
  // Known legitimate South African domains (whitelist)
  private legitimateDomains = new Set([
    'capitecbank.co.za',
    'fnb.co.za',
    'standardbank.co.za',
    'nedbank.co.za',
    'absa.co.za',
    'sars.gov.za',
    'takealot.com',
    'woolworths.co.za',
    'discovery.co.za',
    'mtn.co.za',
    'vodacom.co.za',
    'cellc.co.za',
    'telkom.co.za',
    'gov.za',
    'sassa.gov.za',
    'makro.co.za',
    'checkers.co.za',
    'pnp.co.za',
    'dischem.co.za',
    'clicks.co.za'
  ]);

  // Suspicious patterns for SMS/WhatsApp
  private suspiciousPatterns = {
    urgency: [
      /\b(urgent|immediate|asap|now|quickly|today only)\b/i,
      /\b(account suspended|account blocked|limited time)\b/i,
      /\b(verify now|confirm now|act now|respond immediately)\b/i,
      /\b(expires? (?:in|within) \d+)/i,
      /\b(final (?:warning|notice|reminder))\b/i
    ],
    impersonation: [
      /\b(capitec|fnb|standard bank|absa|nedbank)\s+(secure|verify|update|alert)\b/i,
      /\b(sars|tax|refund|rebate)\b/i,
      /\b(takealot|woolworths|discovery|makro)\s+(delivery|order|package)\b/i,
      /\b(sassa|social grant|srd|r350)\b/i,
      /\b(mtn|vodacom|cell ?c|telkom)\s+(account|airtime|data)\b/i,
      /\bDear (?:valued )?(?:customer|client)\b/i
    ],
    phishing: [
      /bit\.ly\/|tinyurl\.com\/|shorturl\.at\/|rb\.gy\/|ow\.ly\//i,
      /https?:\/\/(?:[a-z0-9-]+\.)*?(?:account|verify|secure|login|update)/i,
      /click\s+(?:here|this|link|below)/i,
      /\b(?:otp|pin|password|cvv|card number|id number)\b/i,
      /update.{0,20}(?:payment|card|details|information)/i
    ],
    emotional: [
      /\b(hi (?:mom|dad|mother|father|mum|pa))\b/i,
      /\b(family emergency|funeral|accident|hospital)\b/i,
      /\b(help me|send money|need (?:funds|cash|help))\b/i,
      /\b(congratulations|you(?:'ve)? won|winner|prize)\b/i,
      /\b(love|romance|soulmate|meet)\b/i
    ],
    money: [
      /\b(?:send|transfer|deposit).{0,30}R?\s*\d{2,}/i,
      /\bR\s*\d{3,}/,
      /\b\d{3,}\s*rand\b/i,
      /\b(?:bank|account)\s+(?:number|details)\b/i,
      /\b(?:bitcoin|crypto|investment|forex)\b/i
    ]
  };

  // Known SA scam phone number patterns
  private scamNumberPatterns = [
    /^\+(?!27)/, // International numbers (not SA)
    /^0[78]\d{8}$/, // Could be spoofed
    /^[A-Z]{3,8}$/, // Alphanumeric sender (often spoofed)
    /^32\d{3}$/ // Short codes (some legitimate, some not)
  ];

  /**
   * Main detection method - analyzes content for scam indicators
   */
  async detectScam(
    content: string,
    contentType: 'sms' | 'whatsapp' | 'url' | 'voicenote',
    senderInfo: SenderInfo = {}
  ): Promise<DetectionResult> {
    const startTime = Date.now();

    // Input validation
    if (!content || content.length < 3) {
      return this.createResult(
        0,
        'safe',
        [],
        'Message too short for analysis',
        startTime,
        'none'
      );
    }

    let signals: string[] = [];
    let riskScore = 0;
    let detectedScamType = 'none';

    // Run all detection engines
    const urgencyScore = this.checkUrgency(content);
    const impersonationScore = this.checkImpersonation(content);
    const phishingScore = this.checkPhishing(content);
    const emotionalScore = this.checkEmotional(content);
    const moneyScore = this.checkMoneyRequests(content);
    const linkScore = await this.checkLinks(content);
    const senderScore = this.checkSender(senderInfo);

    // Calculate weighted risk score
    riskScore = Math.round(
      urgencyScore * 0.15 +
      impersonationScore * 0.25 +
      phishingScore * 0.30 +
      emotionalScore * 0.12 +
      moneyScore * 0.08 +
      linkScore * 0.15 +
      senderScore * 0.10
    );

    // Determine signals
    if (urgencyScore > 0.7) signals.push('urgency');
    if (impersonationScore > 0.6) signals.push('impersonation');
    if (phishingScore > 0.6) signals.push('suspicious_url');
    if (emotionalScore > 0.7) signals.push('emotional_manipulation');
    if (moneyScore > 0.7) signals.push('money_request');
    if (linkScore > 0.8) signals.push('suspicious_url');
    if (senderScore > 0.6) signals.push('spoofed_number');

    // Detect specific scam type
    detectedScamType = this.identifyScamType(content, signals);

    // Determine risk level
    let riskLevel: 'safe' | 'suspicious' | 'dangerous' = 'safe';
    if (riskScore >= 70) {
      riskLevel = 'dangerous';
    } else if (riskScore >= 40) {
      riskLevel = 'suspicious';
    }

    // Generate explanation
    const explanation = this.generateExplanation(
      riskScore,
      signals,
      detectedScamType,
      content,
      contentType
    );

    return this.createResult(
      riskScore,
      riskLevel,
      signals,
      explanation,
      startTime,
      detectedScamType
    );
  }

  /**
   * Check for urgency indicators
   */
  private checkUrgency(content: string): number {
    let score = 0;

    for (const pattern of this.suspiciousPatterns.urgency) {
      if (pattern.test(content)) {
        score += 0.3;
      }
    }

    // Check for CAPS and excessive punctuation
    const capsRatio = (content.match(/[A-Z]{3,}/g) || [])
      .reduce((sum, word) => sum + word.length, 0) / content.length;
    if (capsRatio > 0.3) score += 0.2;

    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 2) score += 0.15;

    return Math.min(score, 1);
  }

  /**
   * Check for brand/organization impersonation
   */
  private checkImpersonation(content: string): number {
    let score = 0;
    const contentLower = content.toLowerCase();

    // Check for brand mentions
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

    // Check for brand-URL mismatch
    const urlMatch = content.match(/https?:\/\/([^\/\s]+)/i);
    if (urlMatch && score > 0.3) {
      const urlDomain = urlMatch[1].toLowerCase();
      let brandMentioned: string | null = null;

      for (const domain of this.legitimateDomains) {
        if (contentLower.includes(domain.split('.')[0])) {
          brandMentioned = domain;
          break;
        }
      }

      if (brandMentioned && !urlDomain.includes(brandMentioned.split('.')[0])) {
        score += 0.5; // Brand mismatch - HIGH risk
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Check for phishing indicators
   */
  private checkPhishing(content: string): number {
    let score = 0;

    // Check phishing patterns
    for (const pattern of this.suspiciousPatterns.phishing) {
      if (pattern.test(content)) {
        score += 0.2;
      }
    }

    // Check for credential requests
    const credentialPhrases = [
      /(?:verify|confirm|update|validate).{0,20}(?:account|details|information)/i,
      /(?:enter|provide|send).{0,20}(?:otp|pin|password|card)/i,
      /\b(?:login|sign in|log in)\b/i
    ];

    for (const pattern of credentialPhrases) {
      if (pattern.test(content)) {
        score += 0.25;
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Check for emotional manipulation
   */
  private checkEmotional(content: string): number {
    let score = 0;

    for (const pattern of this.suspiciousPatterns.emotional) {
      if (pattern.test(content)) {
        score += 0.35;
      }
    }

    // Family relationship claims
    if (/\b(mom|dad|mother|father|son|daughter|family)\b/i.test(content)) {
      score += 0.2;
    }

    // Emergency claims
    if (/\b(accident|emergency|hospital|jail|police)\b/i.test(content)) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  /**
   * Check for money requests
   */
  private checkMoneyRequests(content: string): number {
    let score = 0;

    for (const pattern of this.suspiciousPatterns.money) {
      if (pattern.test(content)) {
        score += 0.3;
      }
    }

    // Large amounts
    const amounts = content.match(/R\s*(\d{1,3}(?:,?\d{3})*)/g);
    if (amounts) {
      amounts.forEach(amount => {
        const value = parseInt(amount.replace(/\D/g, ''));
        if (value > 1000) score += 0.2;
        if (value > 10000) score += 0.3;
      });
    }

    return Math.min(score, 1);
  }

  /**
   * Analyze URLs for suspicious characteristics
   */
  private async checkLinks(content: string): Promise<number> {
    const urls = content.match(/https?:\/\/[^\s]+/gi) || [];

    if (urls.length === 0) return 0;

    let score = 0;

    for (const url of urls) {
      // Shortened URLs
      if (/bit\.ly|tinyurl|shorturl|rb\.gy|ow\.ly|is\.gd/i.test(url)) {
        score += 0.6;
      }

      // IP address URLs
      if (/https?:\/\/(?:\d{1,3}\.){3}\d{1,3}/.test(url)) {
        score += 0.8;
      }

      // Suspicious TLDs
      const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.club', '.click'];
      if (suspiciousTLDs.some(tld => url.toLowerCase().includes(tld))) {
        score += 0.5;
      }

      // Excessive subdomains
      const subdomainCount = (url.match(/\./g) || []).length;
      if (subdomainCount > 3) score += 0.3;

      // Typosquatting check
      for (const legit of this.legitimateDomains) {
        const domain = url.toLowerCase();
        if (domain.includes(legit.split('.')[0]) && !domain.includes(legit)) {
          score += 0.7; // Possible typosquatting
        }
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Check sender information
   */
  private checkSender(senderInfo: SenderInfo): number {
    if (!senderInfo.number) return 0;

    let score = 0;

    // International number (not SA)
    if (senderInfo.number.startsWith('+') && !senderInfo.number.startsWith('+27')) {
      score += 0.4;
    }

    // Alphanumeric sender
    if (/[A-Za-z]/.test(senderInfo.number) && /^\d+$/.test(senderInfo.number) === false) {
      score += 0.3;
    }

    // Mismatched sender name
    if (senderInfo.name) {
      for (const domain of this.legitimateDomains) {
        const brandName = domain.split('.')[0];
        if (senderInfo.name.toLowerCase().includes(brandName)) {
          score += 0.4; // Claiming to be a brand
        }
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Identify specific scam type
   */
  private identifyScamType(content: string, signals: string[]): string {
    const contentLower = content.toLowerCase();

    // Bank scams
    if (/(capitec|fnb|standard bank|absa|nedbank)/i.test(content) &&
        (signals.includes('urgency') || signals.includes('suspicious_url'))) {
      return 'fake_bank_sms';
    }

    // SARS scams
    if (/(sars|tax|refund|rebate)/i.test(content)) {
      return 'sars_phishing';
    }

    // Delivery scams
    if (/(takealot|woolworths|delivery|package|courier|post office)/i.test(content)) {
      return 'delivery_scam';
    }

    // WhatsApp impersonation
    if (/(whatsapp|telegram|new number|phone)/i.test(content) &&
        signals.includes('emotional_manipulation')) {
      return 'whatsapp_impersonation';
    }

    // Family emergency
    if (/\b(hi (?:mom|dad)|family|emergency|funeral|accident)\b/i.test(content)) {
      return 'family_emergency';
    }

    // Job scams
    if (/(job|position|salary|cv|interview|recruitment)/i.test(content) &&
        /(?:urgent|immediate|R\d+|guarantee)/i.test(content)) {
      return 'job_scam';
    }

    // Airtime scams
    if (/(airtime|data|voucher|recharge)/i.test(content)) {
      return 'airtime_scam';
    }

    // OTP fraud
    if (/(otp|one time|verification code|pin|enter code)/i.test(content)) {
      return 'otp_fraud';
    }

    // Investment scams
    if (/(investment|bitcoin|forex|trading|profit|returns)/i.test(content)) {
      return 'investment_scam';
    }

    // Romance scams
    if (/(love|romance|dating|meet|beautiful|handsome)/i.test(content) &&
        signals.includes('money_request')) {
      return 'romance_scam';
    }

    return 'none';
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    riskScore: number,
    signals: string[],
    scamType: string,
    content: string,
    contentType: string
  ): string {
    if (riskScore < 40) {
      return "✓ This message appears safe based on our analysis. No common scam patterns were detected. However, always remain vigilant with unsolicited messages.";
    }

    const scamExplanations: Record<string, string> = {
      fake_bank_sms: "⚠️ SCAM ALERT: This message is impersonating a South African bank. Real banks NEVER ask you to click links, share OTPs, or provide passwords via SMS. Delete immediately and contact your bank directly using their official number.",

      sars_phishing: "⚠️ SARS SCAM: This is a fake SARS tax refund message. SARS never sends SMS with links requesting personal information or payments. Legitimate SARS communication only comes from sars.gov.za domains. Report to SARS.",

      delivery_scam: "📦 DELIVERY SCAM: Scammers pretend to be Takealot, couriers, or Post Office to steal card details. If you ordered something, track it through the official app - never click SMS links for deliveries.",

      whatsapp_impersonation: "💬 WHATSAPP FRAUD: This shows signs of impersonation. Scammers pretend to be family/friends with 'new numbers' to request money. STOP - call the person directly on their known number to verify.",

      family_emergency: "🚨 FAMILY EMERGENCY SCAM: Classic scam exploiting fear for loved ones. Before sending money, CALL your family member directly on their real number. Scammers create urgency to prevent verification.",

      job_scam: "💼 JOB SCAM WARNING: Legitimate companies don't ask for upfront payments, OTPs, or banking details via WhatsApp/SMS. Research the company independently. Never pay for a job opportunity.",

      airtime_scam: "📱 AIRTIME SCAM: Designed to steal your mobile credit or voucher codes. Never share airtime PINs or codes with anyone until verified in person.",

      otp_fraud: "🔐 CRITICAL: OTP HARVESTING ATTEMPT. Your One-Time PINs are keys to your bank account. NEVER share them with ANYONE - not even someone claiming to be from your bank. This is fraud.",

      investment_scam: "💰 INVESTMENT SCAM: Promises of high returns with little risk are classic scam tactics. Legitimate investments are registered with the FSCA. Verify before investing any money.",

      romance_scam: "❤️ ROMANCE SCAM: Online relationships that quickly turn to money requests are scams. Never send money to someone you haven't met in person. These scammers are professionals."
    };

    let explanation = scamExplanations[scamType] || "⚠️ SUSPICIOUS MESSAGE DETECTED: ";

    if (scamType === 'none') {
      const reasons: string[] = [];
      if (signals.includes('urgency')) reasons.push("creates false urgency");
      if (signals.includes('impersonation')) reasons.push("impersonates trusted organizations");
      if (signals.includes('suspicious_url')) reasons.push("contains suspicious links");
      if (signals.includes('emotional_manipulation')) reasons.push("manipulates emotions");
      if (signals.includes('money_request')) reasons.push("requests money");
      if (signals.includes('spoofed_number')) reasons.push("uses suspicious sender");

      explanation += "This message " + reasons.join(", ") + ". DELETE and do not respond or click anything.";
    }

    // Add confidence
    if (riskScore >= 85) {
      explanation += "\n\n🎯 CONFIDENCE: VERY HIGH. This is almost certainly a scam.";
    } else if (riskScore >= 70) {
      explanation += "\n\n⚠️ CONFIDENCE: HIGH. Proceed with extreme caution.";
    } else {
      explanation += "\n\n⚡ CONFIDENCE: MODERATE. When in doubt, verify through official channels.";
    }

    return explanation;
  }

  /**
   * Create standardized result object
   */
  private createResult(
    riskScore: number,
    riskLevel: 'safe' | 'suspicious' | 'dangerous',
    signals: string[],
    explanation: string,
    startTime: number,
    detectedScamType: string
  ): DetectionResult {
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
   * Calculate confidence level
   */
  private calculateConfidence(riskScore: number, signals: string[]): number {
    const signalBonus = Math.min(signals.length * 5, 15);
    return Math.min(riskScore + signalBonus, 99);
  }
}

export const scamDetectionService = new ScamDetectionService();
