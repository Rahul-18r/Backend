import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URL;

// Define RegistrationTeam model
const RegistrationTeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        default: 'registration'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const RegistrationTeam = mongoose.model('RegistrationTeam', RegistrationTeamSchema);

async function addRegistrationUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if username already exists
    const existing = await RegistrationTeam.findOne({ username: 'registration' });
    
    if (existing) {
      console.log('⚠️ Username "registration" already exists:');
      console.log(existing);
      return;
    }

    // Create new registration user
    const newUser = new RegistrationTeam({
      name: 'Registration',
      username: 'registration',
      role: 'registration',
      isActive: true
    });

    await newUser.save();

    console.log('\n✅ Registration user added successfully!');
    console.log('📋 User details:');
    console.log(`   Username: registration`);
    console.log(`   Password: reg@25 (Note: Password is validated at login, not stored)`);
    console.log(`   Name: Registration`);
    console.log(`   Role: registration`);
    console.log(`   Active: true`);

    // Show all registration users
    const allUsers = await RegistrationTeam.find({});
    console.log(`\n📊 Total registration users: ${allUsers.length}`);
    allUsers.forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.username} (${user.name}) - Active: ${user.isActive}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addRegistrationUser();
