// backend/routes/webhook.js
import express from 'express';
import dotenv from 'dotenv';
import { cashfreeWebhook } from '../controllers/webhookController.js';

dotenv.config();

const router = express.Router();

router.post('/cashfree', express.raw({ type: 'application/json' }), cashfreeWebhook);

export default router;