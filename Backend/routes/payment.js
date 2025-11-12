// backend/routes/payment.js
import express from 'express';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import Participant from '../models/Participant.js';
import Event from '../models/eventModel.js';
import TempOrder from '../models/TempOrder.js';
import { generateTicket, generateTicketBuffer } from '../controllers/ticketGeneration.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

// CREATE ORDER
router.post('/create-order', async (req, res) => {
  const { name, usn, college, phone, email, amount, registrations } = req.body;

  // Validate inputs
  if (!name || !usn || !college || !phone || !email || !amount || !registrations) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const order = await createOrder(phone, registrations, usn, name, college, email);

    console.log('Order created:', order.order_id);

    // Save temp data
    const tempOrder = new TempOrder({
      order_id: order.order_id,
      name,
      usn,
      phone,
      college,
      registrations: registrations.map(r => r.event_id)
    });
    await tempOrder.save();
    
    console.log('TempOrder saved:', tempOrder.order_id);

    res.json({
      order_id: order.order_id,
      payment_session_id: order.payment_session_id,
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({ error: 'Order creation failed' });
  }
});

// VERIFY PAYMENT
router.post('/verify', async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    const isPaid = await verifyPayment(order_id);
    res.json({ success: isPaid });
  } catch (error) {
    console.error("Payment verification failed:", error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// GENERATE TICKET
router.post('/generate-ticket', async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    // Find participant with this order_id
    const participant = await Participant.findOne({ 'registrations.order_id': order_id });
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const registration = participant.registrations.find(reg => reg.order_id === order_id);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    if (registration.ticket_url && registration.ticket_url !== 'failed') {
      return res.json({ ticket_url: registration.ticket_url });
    }

    // Generate ticket
    const ticketUrl = await generateTicket(
      participant._id,
      participant.name,
      participant.phone,
      registration.amount,
      participant.registrations.filter(reg => reg.order_id === order_id).length,
      order_id
    );

    // Update registration
    registration.ticket_url = ticketUrl;
    await participant.save();

    res.json({ ticket_url: ticketUrl });
  } catch (error) {
    console.error("Ticket generation failed:", error);
    res.status(500).json({ error: 'Ticket generation failed' });
  }
});

// CREATE PARTICIPANT AND GENERATE TICKET
router.post('/create-participant-and-ticket', async (req, res) => {
  const { order_id } = req.body;

  console.log('=== CREATE PARTICIPANT AND TICKET ===');
  console.log('Order ID:', order_id);

  if (!order_id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    // Fetch order details
    console.log('Fetching order from Cashfree...');
    const orderResponse = await cashfree.PGFetchOrder(order_id);
    const order = orderResponse.data;
    
    console.log('Order status:', order.order_status);

    if (order.order_status !== 'PAID') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Fetch temp order data
    console.log('Fetching temp order from DB...');
    const tempOrder = await TempOrder.findOne({ order_id });
    
    if (!tempOrder) {
      console.error('TempOrder not found for order_id:', order_id);
      return res.status(404).json({ error: 'Order data not found' });
    }

    console.log('TempOrder found:', tempOrder);

    const { name, usn, phone, college, registrations } = tempOrder;

    // Fetch event names
    console.log('Fetching event names for registrations:', registrations);
    const eventIds = registrations;
    const events = await Event.find({ _id: { $in: eventIds } });
    const eventNames = events.map(event => event.eventName);
    console.log('Event names fetched:', eventNames);

    let session;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      // Check if participant already exists
      const existingParticipant = await Participant.findOne({ 
        phone,
        'registrations.order_id': order_id
      }).session(session);

      if (existingParticipant) {
        // Check if ticket already generated
        const registration = existingParticipant.registrations.find(reg => reg.order_id === order_id);
        if (registration.ticket_url && registration.ticket_url !== 'failed') {
          return res.json({ ticket_url: registration.ticket_url });
        }
        // Generate ticket
        // Get event names for this order
        const orderRegistrations = existingParticipant.registrations.filter(reg => reg.order_id === order_id);
        const eventIds = orderRegistrations.map(reg => reg.event_id);
        const events = await Event.find({ _id: { $in: eventIds } });
        const eventNames = events.map(event => event.eventName);

        const ticketUrl = await generateTicket(
          existingParticipant._id,
          existingParticipant.name,
          phone,
          order.order_amount,
          orderRegistrations.length,
          order_id,
          eventNames
        );
        registration.ticket_url = ticketUrl;
        await existingParticipant.save({ session });
        await session.commitTransaction();
        // Delete temp order
        await TempOrder.deleteOne({ order_id });
        return res.json({ ticket_url: ticketUrl });
      }

      // Create new participant
      const MAX_EVENTS = 4;

      let participant = await Participant.findOne({ phone }).session(session);

      if (!participant) {
        participant = new Participant({
          name,
          usn,
          phone,
          college,
          registrations: [],
        });
      }

      // Count current valid registrations
      const currentValidRegistrations = participant.registrations.filter(
        reg => reg.payment_status === 'paid'
      ).length;

      // Calculate remaining event slots
      const remainingSlots = MAX_EVENTS - currentValidRegistrations;

      if (remainingSlots <= 0) {
        await session.commitTransaction();
        return res.status(400).json({ 
          error: 'Maximum event registration limit reached' 
        });
      }

      const newRegistrations = [];

      console.log('Creating new registrations for events:', registrations);

      for (const event_id of registrations) {

        // Stop if no remaining slots
        if (newRegistrations.length >= remainingSlots) break;

        // Check for duplicate registration
        const isDuplicateRegistration = participant.registrations.some(
          reg => reg.event_id.toString() === event_id && reg.payment_status !== 'failed'
        );

        if (isDuplicateRegistration) {
          console.log('Duplicate registration found for event:', event_id);
          continue;
        }

        const ticketUrl = `${process.env.BACKEND_URL}/api/payment/ticket/image/${order_id}`;
        
        console.log('Adding registration for event:', event_id);

        newRegistrations.push({
          event_id,
          ticket_url: ticketUrl,
          amount: order.order_amount,
          order_id,
          payment_status: "paid",
          payment_id: order.payment_id || 'cashfree',
          registration_date: new Date(),
        });
      }

      console.log('New registrations created:', newRegistrations.length);

      // Add new registrations
      if (newRegistrations.length > 0) {
        participant.registrations.push(...newRegistrations);
        await participant.save({ session });
        console.log('Participant saved with new registrations');
      }

      await session.commitTransaction();
      session.endSession();

      console.log('Transaction committed, deleting temp order...');

      // Delete temp order
      await TempOrder.deleteOne({ order_id });
      
      console.log('Temp order deleted');

      const ticketUrl = newRegistrations[0]?.ticket_url;
      console.log('Returning ticket URL:', ticketUrl);
      res.json({ ticket_url: ticketUrl });

    } catch (error) {
      if (session?.inTransaction()) {
        await session.abortTransaction();
      }
      console.error('Transaction error:', error);
      return res.status(500).json({ error: 'Failed to create participant and ticket' });
    } finally {
      if (session) {
        await session.endSession();
      }
    }

  } catch (error) {
    console.error("Error fetching order or processing:", error);
    res.status(500).json({ error: 'Failed to process' });
  }
});

// GET TICKET IMAGE
router.get('/ticket/image/:orderId', async (req, res) => {
  const { orderId } = req.params;

  console.log('📥 Fetching ticket image for order:', orderId);

  try {
    // First, try to serve from local storage
    const ticketsDir = path.join(__dirname, '../tickets');
    const ticketPath = path.join(ticketsDir, `${orderId}.jpg`);
    
    try {
      await fs.access(ticketPath);
      console.log('✅ Ticket found in local storage:', ticketPath);
      
      // Serve the file directly
      const imageBuffer = await fs.readFile(ticketPath);
      res.set('Content-Type', 'image/jpeg');
      res.send(imageBuffer);
      return;
    } catch (fileError) {
      console.log('⚠️ Ticket not found in local storage, generating on-the-fly...');
    }

    // If not found locally, generate it
    const participant = await Participant.findOne({ 'registrations.order_id': orderId });
    if (!participant) {
      console.log('❌ Participant not found for order:', orderId);
      return res.status(404).json({ error: 'Participant not found' });
    }

    console.log('✅ Found participant:', participant.name);

    // Find all registrations with the orderId
    const registrations = participant.registrations.filter(reg => reg.order_id === orderId);
    if (registrations.length === 0) {
      console.log('❌ No registrations found for order:', orderId);
      return res.status(404).json({ error: 'Registration not found' });
    }

    console.log('✅ Found registrations:', registrations.length);

    // Get event ids
    const eventIds = registrations.map(reg => reg.event_id);
    const events = await Event.find({ _id: { $in: eventIds } });
    const eventNames = events.map(event => event.eventName);

    console.log('✅ Event names:', eventNames);

    // Calculate price based on event count (assuming same logic)
    const eventCount = registrations.length;
    const eventPricing = {
      1: 100,
      2: 160,
      3: 220,
      4: 250
    };
    const price = eventPricing[eventCount] || 100;

    console.log('🎫 Generating ticket buffer...');

    // Generate ticket buffer
    const imageBuffer = await generateTicketBuffer(
      participant.ticketUid || participant._id.toString(),
      participant.name,
      participant.phone,
      price,
      eventCount,
      eventNames
    );

    console.log('✅ Ticket buffer generated successfully, size:', imageBuffer.length);
    
    // Save to local storage for future requests
    try {
      await fs.mkdir(ticketsDir, { recursive: true });
      await fs.writeFile(ticketPath, imageBuffer);
      console.log('💾 Ticket saved to local storage:', ticketPath);
    } catch (saveError) {
      console.warn('⚠️ Could not save ticket to local storage:', saveError.message);
    }

    // Send the image
    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  } catch (error) {
    console.error('❌ Error generating ticket image:', error);
    res.status(500).json({ error: 'Failed to generate ticket image' });
  }
});

export default router;