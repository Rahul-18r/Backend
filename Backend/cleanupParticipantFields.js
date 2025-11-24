import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URL;

// Define Participant model
const participantSchema = new mongoose.Schema({}, { strict: false, collection: 'participants' });
const Participant = mongoose.model('Participant', participantSchema);

async function cleanupFields() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Remove only teamInfo duplicate field
    const result = await Participant.updateMany(
      {},
      {
        $unset: {
          teamInfo: ""           // Duplicates registrations data
        }
      }
    );

    console.log(`\n✅ Cleanup completed!`);
    console.log(`📊 Documents modified: ${result.modifiedCount}`);
    console.log(`📊 Documents matched: ${result.matchedCount}`);

    // Show updated structure of Pavan's document
    const pavan = await Participant.findOne({ phone: "7892250391" }).lean();
    
    console.log('\n📋 Updated document structure (Pavan S):');
    console.log('Fields remaining:', Object.keys(pavan).join(', '));
    console.log('\n📄 Clean document:');
    console.log(JSON.stringify(pavan, null, 2));

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupFields();
