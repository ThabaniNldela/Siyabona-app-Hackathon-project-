import mongoose, { Schema, Document } from 'mongoose';

export interface IScamReport extends Document {
  userId: string;
  reportType: 'sms' | 'whatsapp' | 'call' | 'email' | 'other';
  description: string;
  scammerContact?: string;
  links?: string[];
  amount?: number;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scamReportSchema = new Schema<IScamReport>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['sms', 'whatsapp', 'call', 'email', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  scammerContact: {
    type: String
  },
  links: [{
    type: String
  }],
  amount: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedBy: String,
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

scamReportSchema.index({ status: 1 });
scamReportSchema.index({ createdAt: -1 });

export const ScamReport = mongoose.model<IScamReport>('ScamReport', scamReportSchema);
