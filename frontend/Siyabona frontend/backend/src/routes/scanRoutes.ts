import express from 'express';
import { body } from 'express-validator';
import { scanController } from '../controllers/scanController';

const router = express.Router();

// Validation rules
const smsValidation = [
  body('message')
    .notEmpty().withMessage('Message content is required')
    .isLength({ min: 3, max: 5000 }).withMessage('Message must be between 3 and 5000 characters'),
  body('senderNumber').optional().isString(),
  body('senderName').optional().isString(),
  body('consentGiven').optional().isBoolean()
];

const whatsAppValidation = [
  body('message')
    .notEmpty().withMessage('Message content is required')
    .isLength({ min: 3, max: 5000 }),
  body('senderNumber').optional().isString(),
  body('messageType').optional().isIn(['text', 'voice', 'video', 'image'])
];

const urlValidation = [
  body('url')
    .notEmpty().withMessage('URL is required')
    .isURL({ require_protocol: true }).withMessage('Invalid URL format')
];

// Routes
router.post('/sms', smsValidation, scanController.scanSMS.bind(scanController));
router.post('/whatsapp', whatsAppValidation, scanController.scanWhatsApp.bind(scanController));
router.post('/url', urlValidation, scanController.scanURL.bind(scanController));
router.post('/bulk', scanController.bulkScan.bind(scanController));
router.get('/stats', scanController.getUserStats.bind(scanController));

export default router;
