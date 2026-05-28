import mongoose, { Schema, Document } from 'mongoose';

export interface IScanResult extends Document {
  userId: string;
  content: string;
  contentType: 'sms' | 'whatsapp' | 'url' | 'voicenote';
  riskScore: number;
  riskLevel: 'safe' | 'suspicious' | 'dangerous';
  signals: string[];
  explanation: string;
  detectedScamType: string;
  metadata: {
    senderNumber?: string;
    senderName?: string;
    linksDetected?: string[];
    processingTimeMs?: number;
    modelVersion?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  createdAt: Date;
}

const scanResultSchema = new Schema<IScanResult>({
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
    enum: [
      'urgency',
      'impersonation',
      'suspicious_url',
      'shortened_link',
      'brand_mismatch',
      'emotional_manipulation',
      'spoofed_number',
      'fake_deepfake',
      'grammar_issues',
      'unknown_sender',
      'credential_request',
      'money_request'
    ]
  }],
  explanation: {
    type: String,
    required: true
  },
  detectedScamType: {
    type: String,
    enum: [
      'fake_bank_sms',
      'sars_phishing',
      'delivery_scam',
      'whatsapp_impersonation',
      'family_emergency',
      'job_scam',
      'airtime_scam',
      'otp_fraud',
      'investment_scam',
      'romance_scam',
      'none'
    ],
    default: 'none'
  },
  metadata: {
    senderNumber: String,
    senderName: String,
    linksDetected: [String],
    processingTimeMs: Number,
    modelVersion: String,
    ipAddress: String,
    userAgent: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days auto-delete for POPIA compliance
  }
});

// Indexes for performance
scanResultSchema.index({ createdAt: -1 });
scanResultSchema.index({ userId: 1, createdAt: -1 });
scanResultSchema.index({ riskLevel: 1 });
scanResultSchema.index({ detectedScamType: 1 });

export const ScanResult = mongoose.model<IScanResult>('ScanResult', scanResultSchema);
