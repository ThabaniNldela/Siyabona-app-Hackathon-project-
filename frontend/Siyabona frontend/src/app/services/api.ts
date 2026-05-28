// API Service for SIYABONA Mobile IPS
export interface ScanResult {
  riskScore: number;
  riskLevel: 'safe' | 'suspicious' | 'dangerous';
  signals: string[];
  explanation: string;
  confidence: number;
  detectedScamType: string;
  domainAnalysis?: {
    domain: string;
    isIpAddress: boolean;
    tld: string;
    isSuspiciousTld: boolean;
    subdomainCount: number;
  };
}

export interface UserStats {
  totalScans: number;
  dangerousCount: number;
  suspiciousCount: number;
  avgRiskScore: number;
}

// Use environment variable or default to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  // Mock data for demonstration
  private async mockScan(content: string, type: 'sms' | 'whatsapp' | 'url'): Promise<ScanResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock scam detection logic
    const contentLower = content.toLowerCase();
    let riskScore = 0;
    const signals: string[] = [];

    // Check for urgency
    if (/(urgent|immediately|asap|now|act now|verify now)/i.test(content)) {
      riskScore += 25;
      signals.push('urgency');
    }

    // Check for impersonation
    if (/(capitec|fnb|standard bank|absa|nedbank|sars|takealot|woolworths)/i.test(content)) {
      riskScore += 30;
      signals.push('impersonation');
    }

    // Check for suspicious URLs
    if (/(https?:\/\/|bit\.ly|tinyurl|click here)/i.test(content)) {
      riskScore += 25;
      signals.push('suspicious_url');
    }

    // Check for emotional manipulation
    if (/(hi mom|hi dad|emergency|help|accident|won|prize|congratulations)/i.test(content)) {
      riskScore += 20;
      signals.push('emotional_manipulation');
    }

    // Determine risk level
    let riskLevel: 'safe' | 'suspicious' | 'dangerous' = 'safe';
    if (riskScore >= 70) {
      riskLevel = 'dangerous';
    } else if (riskScore >= 40) {
      riskLevel = 'suspicious';
    }

    // Generate explanation
    let explanation = '';
    if (riskLevel === 'dangerous') {
      explanation = '⚠️ SCAM DETECTED! This message contains multiple red flags. Real banks and companies NEVER ask for sensitive information via SMS or links. Delete this message immediately and contact the organization directly using their official number.';
    } else if (riskLevel === 'suspicious') {
      explanation = '⚠️ This message shows suspicious characteristics. It uses urgency tactics and may be attempting to impersonate a trusted organization. Verify through official channels before taking any action.';
    } else {
      explanation = '✓ This message appears safe based on our analysis. No common scam patterns were detected. However, always remain vigilant with unsolicited messages.';
    }

    const confidence = Math.min(riskScore + (signals.length * 5), 95);

    return {
      riskScore,
      riskLevel,
      signals,
      explanation,
      confidence,
      detectedScamType: riskLevel === 'dangerous' ? 'fake_bank_sms' : 'none',
    };
  }

  async scanSMS(message: string, senderNumber?: string): Promise<ScanResult> {
    try {
      // Try real API first, fallback to mock
      if (API_BASE_URL.includes('localhost') === false || API_BASE_URL.includes('3000')) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/scan/sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, senderNumber, consentGiven: true }),
          });
          const data = await response.json();
          if (data.success && data.result) {
            return data.result;
          }
        } catch (apiError) {
          console.warn('API unavailable, using mock:', apiError);
        }
      }

      // Fallback to mock
      return this.mockScan(message, 'sms');
    } catch (error) {
      console.error('SMS scan error:', error);
      throw error;
    }
  }

  async scanWhatsApp(message: string, senderNumber?: string): Promise<ScanResult> {
    try {
      if (API_BASE_URL.includes('localhost') === false || API_BASE_URL.includes('3000')) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/scan/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, senderNumber, messageType: 'text' }),
          });
          const data = await response.json();
          if (data.success && data.result) {
            return data.result;
          }
        } catch (apiError) {
          console.warn('API unavailable, using mock:', apiError);
        }
      }
      return this.mockScan(message, 'whatsapp');
    } catch (error) {
      console.error('WhatsApp scan error:', error);
      throw error;
    }
  }

  async scanURL(url: string): Promise<ScanResult> {
    try {
      if (API_BASE_URL.includes('localhost') === false || API_BASE_URL.includes('3000')) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/scan/url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          const data = await response.json();
          if (data.success && data.result) {
            return data.result;
          }
        } catch (apiError) {
          console.warn('API unavailable, using mock:', apiError);
        }
      }

      const result = await this.mockScan(url, 'url');

      // Add domain analysis for URLs
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const tld = domain.split('.').pop() || '';

        result.domainAnalysis = {
          domain,
          isIpAddress: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain),
          tld,
          isSuspiciousTld: ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top'].includes('.' + tld),
          subdomainCount: (domain.match(/\./g) || []).length,
        };

        if (result.domainAnalysis.isIpAddress) {
          result.riskScore = Math.min(result.riskScore + 30, 100);
          result.riskLevel = 'dangerous';
        }
      } catch {
        // Invalid URL
      }

      return result;
    } catch (error) {
      console.error('URL scan error:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      if (API_BASE_URL.includes('localhost') === false || API_BASE_URL.includes('3000')) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/scan/stats`);
          const data = await response.json();
          if (data.success && data.stats) {
            return data.stats;
          }
        } catch (apiError) {
          console.warn('Stats API unavailable, using mock:', apiError);
        }
      }

      // Mock stats for demonstration
      return {
        totalScans: 42,
        dangerousCount: 8,
        suspiciousCount: 12,
        avgRiskScore: 35,
      };
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
}

export const apiService = new ApiService();
