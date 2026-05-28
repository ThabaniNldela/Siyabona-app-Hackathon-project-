import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ScamReport } from '../models/ScamReport';
import crypto from 'crypto';

const router = express.Router();

// Create scam report
router.post('/',
  [
    body('reportType').isIn(['sms', 'whatsapp', 'call', 'email', 'other']),
    body('description').isLength({ min: 10, max: 5000 }),
    body('scammerContact').optional().isString(),
    body('amount').optional().isNumeric()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = crypto.createHash('sha256')
        .update(req.body.userId || req.ip || 'anonymous')
        .digest('hex')
        .substring(0, 32);

      const report = new ScamReport({
        userId,
        reportType: req.body.reportType,
        description: req.body.description,
        scammerContact: req.body.scammerContact,
        links: req.body.links,
        amount: req.body.amount
      });

      await report.save();

      res.status(201).json({
        success: true,
        message: 'Thank you for reporting. This helps protect the community.',
        reportId: report._id
      });
    } catch (error) {
      console.error('Report error:', error);
      res.status(500).json({ error: 'Failed to submit report' });
    }
  }
);

// Get user's reports
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = crypto.createHash('sha256')
      .update(req.body.userId || req.ip || 'anonymous')
      .digest('hex')
      .substring(0, 32);

    const reports = await ScamReport.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;
