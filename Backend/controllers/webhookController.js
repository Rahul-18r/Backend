import Participant from "../models/Participant.js";
import crypto from "crypto";
import mongoose from "mongoose";
import { generateTicket } from "../controllers/ticketGeneration.js";
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Cashfree client
const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

// Helper function for signature validation
const validateSignature = (reqBody, receivedSignature, webhookSecret) => {
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(reqBody))
    .digest("hex");

  return receivedSignature === expectedSignature;
};

export const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Validate Webhook Signature
  const receivedSignature = req.headers["x-razorpay-signature"];
  if (!validateSignature(req.body, receivedSignature, webhookSecret)) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const { payload } = req.body;
  const { id: razorpay_payment_id, order_id, amount, status, notes = {} } = payload.payment.entity;

  const { college, name, phone, registrations = [], usn } = notes;

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    // Find existing participant and check for existing order, ignoring failed payment events
    const existingParticipant = await Participant.findOne({ 
      phone,
      registrations: {
        $elemMatch: { 
          order_id: order_id,
          event_id: { $in: registrations.map(reg => reg.event_id) },
          payment_status: { $ne: 'failed' }
        }
      }
    }).session(session);

    // If exact order and event combination already exists, return success to prevent duplicates
    if (existingParticipant) {
      console.warn(`Duplicate order detected: ${order_id}`);
      await session.commitTransaction();
      return res.status(200).json({ success: true, message: "Order already processed" });
    }

    const MAX_EVENTS = 4;

    // Find or create participant
    let participant = await Participant.findOne({ phone }).session(session);
    
    const isNewParticipant = !participant;

    if (isNewParticipant) {
      participant = new Participant({
        name,
        usn,
        phone,
        college,
        registrations: [],
      });
      console.log(`Creating new participant for phone: ${phone}`);
      // Save to generate _id and ticketUid
      await participant.save({ session });
      console.log(`New participant saved with ticketUid: ${participant.ticketUid}`);
    }

    // Count current valid registrations (only paid ones)
    const currentValidRegistrations = participant.registrations.filter(
      reg => reg.payment_status === 'paid'
    ).length;

    console.log(`Current valid registrations: ${currentValidRegistrations}`);
    console.log(`New events to register: ${registrations.length}`);

    // Calculate remaining event slots
    const remainingSlots = MAX_EVENTS - currentValidRegistrations;
    console.log(`Remaining slots: ${remainingSlots}`);

    // Check if the new registrations would exceed the limit
    if (currentValidRegistrations + registrations.length > MAX_EVENTS) {
      console.warn(`Cannot add ${registrations.length} events. Only ${remainingSlots} slots available for participant: ${phone}`);
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: `Cannot register for ${registrations.length} events. Only ${remainingSlots} slot(s) available. Maximum ${MAX_EVENTS} events allowed.`
      });
    }

    const isPaid = status === "captured";
    const newRegistrations = [];

    for (const event of registrations) {
      const event_id = event.event_id;

      // Check for duplicate registration within existing registrations, ignoring failed events
      const isDuplicateRegistration = participant.registrations.some(
        reg => reg.event_id.toString() === event_id && reg.payment_status !== 'failed'
      );

      if (isDuplicateRegistration) {
        console.warn(`Skipping duplicate registration for event: ${event_id}`);
        continue;
      }

      let ticketUrl = "failed";
      
      if (isPaid) {
        try {
          console.log(`🎫 Generating ticket for: ${participant.name}, TicketUID: ${participant.ticketUid || participant._id.toString()}`);
          
          ticketUrl = await generateTicket(
            participant.ticketUid || participant._id.toString(),
            participant.name,
            phone,
            amount / 100,
            registrations.length,
            order_id
          );
          
          console.log(`✅ Ticket generated successfully: ${ticketUrl}`);
        } catch (ticketError) {
          console.error(`❌ ERROR generating ticket:`, {
            error: ticketError.message,
            stack: ticketError.stack,
            participant: participant.name,
            ticketUid: participant.ticketUid || participant._id.toString()
          });
          
          // Don't throw - save registration with "failed" ticket_url
          ticketUrl = "failed";
        }
      }

      newRegistrations.push({
        event_id,
        ticket_url: ticketUrl,
        amount: amount / 100,
        order_id,
        payment_status: isPaid ? "paid" : "failed",
        razorpay_payment_id,
        registration_date: new Date(),
      });
    }

    // Add new registrations to the participant's registrations array
    if (newRegistrations.length > 0) {
      participant.registrations.push(...newRegistrations);
      await participant.save({ session });
      console.log(`✅ Participant saved successfully with ${newRegistrations.length} registrations`);
      console.log(`✅ Order ID: ${order_id}, Phone: ${phone}, Participant ID: ${participant._id}`);
    } else {
      console.warn(`⚠️ No new registrations to add for order: ${order_id}`);
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ 
      success: true, 
      registrationsAdded: newRegistrations.length 
    });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }
    console.error('Webhook processing error:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error', 
      error: error.message 
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

export const cashfreeWebhook = async (req, res) => {
  console.log('🔔 Cashfree webhook received!');
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString();

  console.log('Signature:', signature);
  console.log('Payload:', payload);

  const expected = crypto
    .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
    .update(payload)
    .digest('hex');

  if (signature !== expected) {
    console.error('❌ Invalid webhook signature!');
    console.error('Expected:', expected);
    console.error('Received:', signature);
    return res.status(401).send('Invalid signature');
  }

  console.log('✅ Webhook signature validated');

  const { event, data } = JSON.parse(payload);
  
  console.log('Event type:', event);
  console.log('Payment status:', data?.payment?.payment_status);

  if (event === 'PAYMENT_SUCCESS_WEBHOOK' && data.payment.payment_status === 'SUCCESS') {
    const order_id = data.order.order_id;
    
    console.log('💰 Payment successful for order:', order_id);

    // Fetch order details to get metadata
    try {
      console.log('📋 Fetching order details from Cashfree...');
      const orderResponse = await cashfree.PGFetchOrder(order_id);
      const order = orderResponse.data;
      
      console.log('📝 Order details:', {
        order_id: order.order_id,
        order_amount: order.order_amount,
        order_note: order.order_note
      });
      
      const noteData = JSON.parse(order.order_note);
      const { name, usn, phone, college, registrations } = noteData;

      console.log('👤 Participant details:', {
        name,
        phone,
        usn,
        college,
        registrations: registrations
      });

      const parsedRegistrations = JSON.parse(registrations);
      
      console.log('🎫 Parsed registrations:', parsedRegistrations);

      let session;
      try {
        session = await mongoose.startSession();
        session.startTransaction();

        // Find existing participant and check for existing order
        const existingParticipant = await Participant.findOne({ 
          phone,
          registrations: {
            $elemMatch: { 
              order_id: order_id,
              event_id: { $in: parsedRegistrations.map(reg => reg.event_id) },
              payment_status: { $ne: 'failed' }
            }
          }
        }).session(session);

        if (existingParticipant) {
          console.warn(`Duplicate order detected: ${order_id}`);
          await session.commitTransaction();
          return res.status(200).json({ success: true, message: "Order already processed" });
        }

        const MAX_EVENTS = 4;

        // Find or create participant
        let participant = await Participant.findOne({ phone }).session(session);
        
        const isNewParticipant = !participant;

        if (isNewParticipant) {
          participant = new Participant({
            name,
            usn,
            phone,
            college,
            registrations: [],
          });
          console.log(`Creating new participant for phone: ${phone}`);
          // Save to generate _id and ticketUid
          await participant.save({ session });
          console.log(`New participant saved with ticketUid: ${participant.ticketUid}`);
        }

        // Count current valid registrations (only paid ones)
        const currentValidRegistrations = participant.registrations.filter(
          reg => reg.payment_status === 'paid'
        ).length;

        console.log(`Current valid registrations: ${currentValidRegistrations}`);
        console.log(`New events to register: ${parsedRegistrations.length}`);

        // Calculate remaining event slots
        const remainingSlots = MAX_EVENTS - currentValidRegistrations;
        console.log(`Remaining slots: ${remainingSlots}`);

        // Check if the new registrations would exceed the limit
        if (currentValidRegistrations + parsedRegistrations.length > MAX_EVENTS) {
          console.warn(`Cannot add ${parsedRegistrations.length} events. Only ${remainingSlots} slots available for participant: ${phone}`);
          await session.abortTransaction();
          return res.status(400).json({ 
            success: false, 
            message: `Cannot register for ${parsedRegistrations.length} events. Only ${remainingSlots} slot(s) available. Maximum ${MAX_EVENTS} events allowed.`
          });
        }

        const isPaid = true; // Since it's PAYMENT_SUCCESS
        const newRegistrations = [];

        for (const event of parsedRegistrations) {
          const event_id = event.event_id;

          // Check for duplicate registration
          const isDuplicateRegistration = participant.registrations.some(
            reg => reg.event_id.toString() === event_id && reg.payment_status !== 'failed'
          );

          if (isDuplicateRegistration) {
            console.warn(`Skipping duplicate registration for event: ${event_id}`);
            continue;
          }

          let ticketUrl = "failed";
          
          try {
            console.log(`🎫 Generating ticket for: ${participant.name}, TicketUID: ${participant.ticketUid || participant._id.toString()}`);
            
            ticketUrl = await generateTicket(
              participant.ticketUid || participant._id.toString(),
              participant.name,
              phone,
              order.order_amount,
              parsedRegistrations.length,
              order_id
            );
            
            console.log(`✅ Ticket generated successfully: ${ticketUrl}`);
          } catch (ticketError) {
            console.error(`❌ ERROR generating ticket:`, {
              error: ticketError.message,
              stack: ticketError.stack,
              participant: participant.name,
              ticketUid: participant.ticketUid || participant._id.toString()
            });
            
            // Don't throw - save registration with "failed" ticket_url
            ticketUrl = "failed";
          }

          newRegistrations.push({
            event_id,
            ticket_url: ticketUrl,
            amount: order.order_amount,
            order_id,
            payment_status: "paid",
            payment_id: data.payment.payment_id,
            registration_date: new Date(),
          });
        }

        // Add new registrations to the participant's registrations array
        if (newRegistrations.length > 0) {
          participant.registrations.push(...newRegistrations);
          await participant.save({ session });
          console.log(`✅ Participant saved successfully with ${newRegistrations.length} registrations`);
          console.log(`✅ Order ID: ${order_id}, Phone: ${phone}, Participant ID: ${participant._id}`);
        } else {
          console.warn(`⚠️ No new registrations to add for order: ${order_id}`);
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ 
          success: true, 
          registrationsAdded: newRegistrations.length 
        });
      } catch (error) {
        if (session?.inTransaction()) {
          await session.abortTransaction();
        }
        console.error('Webhook processing error:', error);
        return res.status(500).json({ 
          message: 'Internal Server Error', 
          error: error.message 
        });
      } finally {
        if (session) {
          await session.endSession();
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ error: 'Failed to fetch order details' });
    }
  }

  res.status(200).send('OK');
};