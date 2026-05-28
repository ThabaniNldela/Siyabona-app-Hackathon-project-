import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import { ScanResult } from '../models/ScanResult';
import { scamDetectionService } from '../services/ScamDetectionService';

// Rate limiting per user
const userRateLimits = new Map<string, { count: number; resetTime: number }>();

class ScanController {
  /**
   * Scan SMS content for scams
   */
  async scanSMS(req: Request, res: Response): Promise<void> {
    try {
      // Check rate limits
      if (!this.checkRateLimit(req.body.userId || req.ip || 'anonymous')) {
        res.status(429).json({
          error: 'Rate limit exceeded. Please wait before scanning more messages.',
          retryAfter: 60
        });
        return;
      }

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { message, senderNumber, senderName, consentGiven } = req.body;

      // Anonymize user ID for POPIA compliance
      const userId = this.anonymizeId(req.body.userId || req.ip || 'anonymous');

      // Run scam detection
      const result = await scamDetectionService.detectScam(
        message,
        'sms',
        { number: senderNumber, name: senderName }
      );

      // Store result with user consent (POPIA requirement)
      if (consentGiven === true) {
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
            senderNumber: senderNumber ? this.hashPhoneNumber(senderNumber) : undefined,
            senderName: senderName,
            linksDetected: this.extractLinks(message),
            processingTimeMs: result.processingTimeMs,
            modelVersion: '1.0.0',
            ipAddress: this.anonymizeId(req.ip || ''),
            userAgent: req.get('user-agent')
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
  async scanWhatsApp(req: Request, res: Response): Promise<void> {
    try {
      if (!this.checkRateLimit(req.body.userId || req.ip || 'anonymous')) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      const { message, senderNumber, messageType } = req.body;

      const result = await scamDetectionService.detectScam(
        message,
        'whatsapp',
        { number: senderNumber }
      );

      // Add WhatsApp-specific warnings
      if (messageType === 'voice' || /voice/i.test(message)) {
        result.explanation = "🎤 VOICE NOTE WARNING: " + result.explanation +
          "\n\nAI voice cloning is increasingly used in WhatsApp scams. " +
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
  async scanURL(req: Request, res: Response): Promise<void> {
    try {
      if (!this.checkRateLimit(req.body.userId || req.ip || 'anonymous')) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      const { url } = req.body;

      if (!url || !this.isValidUrl(url)) {
        res.status(400).json({ error: 'Invalid URL provided' });
        return;
      }

      const result = await scamDetectionService.detectScam(url, 'url', {});

      // Domain analysis
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
  async bulkScan(req: Request, res: Response): Promise<void> {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length > 10) {
        res.status(400).json({ error: 'Maximum 10 items per bulk scan' });
        return;
      }

      const results = [];
      for (const item of items) {
        const result = await scamDetectionService.detectScam(
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
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.anonymizeId(req.body.userId || req.ip || 'anonymous');

      const stats = await ScanResult.aggregate([
        { $match: { userId } },
        {
          $group: {
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
        stats: stats[0] || {
          totalScans: 0,
          dangerousCount: 0,
          suspiciousCount: 0,
          avgRiskScore: 0
        }
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }

  // Helper methods

  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const userLimit = userRateLimits.get(identifier) || { count: 0, resetTime: now + 60000 };

    if (now > userLimit.resetTime) {
      userRateLimits.set(identifier, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (userLimit.count >= 10) {
      return false;
    }

    userLimit.count++;
    userRateLimits.set(identifier, userLimit);
    return true;
  }

  private anonymizeId(id: string): string {
    return crypto.createHash('sha256').update(id).digest('hex').substring(0, 32);
  }

  private hashPhoneNumber(phone: string): string {
    return crypto.createHash('sha256').update(phone).digest('hex');
  }

  private extractLinks(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/gi;
    return text.match(urlRegex) || [];
  }

  private isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  private analyzeDomain(url: string) {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname;
      const tld = domain.split('.').pop() || '';

      return {
        domain,
        isIpAddress: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain),
        tld,
        isSuspiciousTld: ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top'].includes('.' + tld),
        subdomainCount: (domain.match(/\./g) || []).length
      };
    } catch {
      return null;
    }
  }
}

export const scanController = new ScanController();
