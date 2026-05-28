import express, { Request, Response } from 'express';

const router = express.Router();

// User profile placeholder
router.get('/profile', async (req: Request, res: Response) => {
  res.json({
    success: true,
    user: {
      id: 'anonymous',
      plan: 'free',
      scansRemaining: 'unlimited'
    }
  });
});

export default router;
