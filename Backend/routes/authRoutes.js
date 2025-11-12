import express from "express";
import { registerParticipant } from "../controllers/registrationController.js";
import getAllEventDetails, { preloadCache } from "../controllers/eventController.js";
import { razorpayWebhook } from "../controllers/webhookController.js";
import { verifyTicket } from "../controllers/verifyQrcode.js";
//router object
const router = express.Router();

//routing
// Event routes
router.get('/events', getAllEventDetails);  // Get all events with caching

// Payment routes
router.post('/payment', registerParticipant);
router.post('/payment/webhooks', express.json({
    verify: (req, res, buf) => { req.rawBody = buf; }
}), razorpayWebhook);

// Ticket verification routes - support both GET and POST
// GET: /verify/ticket?ticketUid=PARTICIPANT_ID (for QR code scanning)
// POST: /verify/ticket with body { ticketUid: PARTICIPANT_ID }
router.get('/verify/ticket', verifyTicket);
router.post('/verify/ticket', verifyTicket);

// Alternative shorter route for QR scanning
router.get('/verify', verifyTicket);

// Preload the events cache when the server starts
preloadCache();

export default router;