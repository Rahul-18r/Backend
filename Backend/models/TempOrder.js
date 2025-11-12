import mongoose from 'mongoose';

const TempOrderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  usn: { type: String, required: true },
  phone: { type: String, required: true },
  college: { type: String, required: true },
  registrations: [{ type: String, required: true }], // array of event_ids
  createdAt: { type: Date, default: Date.now, expires: '1h' } // expire after 1 hour
});

const TempOrder = mongoose.model('TempOrder', TempOrderSchema);

export default TempOrder;