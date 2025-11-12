import Participant from '../models/Participant.js';
import Event from '../models/eventModel.js';

// Verify ticket by ticketUid (participant ID or custom ticketUid)
// Supports both GET (query params) and POST (body)
export const verifyTicket = async (req, res) => {
    try {
      // Support both query parameter (GET) and body parameter (POST)
      const ticketUid = req.query.ticketUid || req.body.ticketUid || req.body.id;
      
      if (!ticketUid) {
        return res.status(400).json({ 
          success: false,
          message: 'Ticket UID is required' 
        });
      }

      // Find participant by either MongoDB _id or custom ticketUid field
      let participant;
      
      // Try to find by custom ticketUid first
      participant = await Participant.findOne({ ticketUid: ticketUid });
      
      // If not found, try by MongoDB _id (for backward compatibility)
      if (!participant) {
        participant = await Participant.findById(ticketUid);
      }
      
      if (!participant) {
        return res.status(404).json({ 
          success: false,
          message: 'Ticket not found or invalid' 
        });
      }

      // Get all paid registrations
      const paidRegistrations = participant.registrations.filter(
        reg => reg.payment_status === 'paid'
      );

      if (paidRegistrations.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'No valid paid registrations found for this ticket' 
        });
      }

      // Fetch event details for all registered events
      const eventIds = paidRegistrations.map(reg => reg.event_id);
      const events = await Event.find({ _id: { $in: eventIds } });

      // Create a map of event details
      const eventMap = {};
      events.forEach(event => {
        eventMap[event._id.toString()] = {
          eventName: event.eventName,
          eventType: event.eventType,
          date: event.date,
          time: event.time,
          venue: event.venue
        };
      });

      // Combine registration and event data
      const registrationDetails = paidRegistrations.map(reg => ({
        event_id: reg.event_id,
        eventDetails: eventMap[reg.event_id.toString()] || null,
        ticket_url: reg.ticket_url,
        amount: reg.amount,
        order_id: reg.order_id,
        payment_status: reg.payment_status,
        registration_date: reg.registration_date
      }));

      // Return formatted response
      res.status(200).json({
        success: true,
        message: 'Ticket verified successfully',
        data: {
          ticketUid: participant.ticketUid || participant._id,
          participantInfo: {
            name: participant.name,
            usn: participant.usn,
            phone: participant.phone,
            college: participant.college
          },
          registrations: registrationDetails,
          totalEvents: paidRegistrations.length,
          verifiedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error verifying ticket:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error verifying ticket', 
        error: error.message 
      });
    }
  };