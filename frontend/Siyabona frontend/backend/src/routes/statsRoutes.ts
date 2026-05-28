import express, { Request, Response } from 'express';
import { ScanResult } from '../models/ScanResult';
import { ScamReport } from '../models/ScamReport';

const router = express.Router();

// Get global scam statistics
router.get('/global', async (req: Request, res: Response) => {
  try {
    const stats = await ScanResult.aggregate([
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

    const scamTypeStats = await ScanResult.aggregate([
      {
        $match: { detectedScamType: { $ne: 'none' } }
      },
      {
        $group: {
          _id: '$detectedScamType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalScans: 0,
        dangerousCount: 0,
        suspiciousCount: 0,
        avgRiskScore: 0
      },
      topScamTypes: scamTypeStats
    });
  } catch (error) {
    console.error('Global stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get scam trends
router.get('/scams', async (req: Request, res: Response) => {
  try {
    const recentScams = await ScanResult.find({ riskLevel: 'dangerous' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('detectedScamType signals createdAt');

    const scamReports = await ScamReport.find({ verified: true })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      recentScams,
      verifiedReports: scamReports
    });
  } catch (error) {
    console.error('Scam stats error:', error);
    res.status(500).json({ error: 'Failed to fetch scam data' });
  }
});

export default router;
