import mongoose from 'mongoose';
import crypto from 'crypto';

const ParticipantSchema = new mongoose.Schema({
   name: { type: String, required: true },
   usn: { type: String, required: true },
   phone: { type: String, required: true, unique: true },
   college: { type: String, required: true },
   ticketUid: { 
      type: String, 
      unique: true,
      default: function() {
         // Generate unique ticket UID: FEST-YYYYMMDD-RANDOM
         const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
         const random = crypto.randomBytes(4).toString('hex').toUpperCase();
         return `FEST-${date}-${random}`;
      }
   },
   registrations: [{
      event_id: { type: mongoose.Schema.Types.ObjectId, required: false },
      ticket_url: { type: String, default: null},
      amount: { type: Number, required: false },
      order_id: { type: String, default: null },
      payment_status: { type: String, default: null },
      razorpay_payment_id: { type: String, default: null },
      registration_date: { type: Date, default: Date.now },
   }]
}, {
   timestamps: true, // Adds createdAt and updatedAt fields
   versionKey: false // Removes the __v field
});

// Create index on ticketUid for faster lookups
ParticipantSchema.index({ ticketUid: 1 });

// Export the model
const Participant = mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);
export default Participant;
