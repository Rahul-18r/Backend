import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URL;

// Define Admin model
const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    phone: {
        type: Number,
        required: [true, 'Phone number is required'],
        unique: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v.toString());
            },
            message: 'Please enter a valid 10-digit phone number'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    }
});

const Admin = mongoose.model('admin', adminSchema);

async function addAdminUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin with name "registration" already exists
    const existing = await Admin.findOne({ name: 'registration' });
    
    if (existing) {
      console.log('⚠️ Admin "registration" already exists:');
      console.log(`   Name: ${existing.name}`);
      console.log(`   Phone: ${existing.phone}`);
      return;
    }

    // Create new admin user
    const newAdmin = new Admin({
      name: 'registration',
      phone: 9999999999, // Unique phone number
      password: 'reg@25' // Plain text password as per admin login logic
    });

    await newAdmin.save();

    console.log('\n✅ Admin user added successfully!');
    console.log('📋 Admin credentials:');
    console.log(`   Name: registration`);
    console.log(`   Password: reg@25`);
    console.log(`   Phone: 9999999999`);

    // Show all admins
    const allAdmins = await Admin.find({}).select('name phone');
    console.log(`\n📊 Total admins: ${allAdmins.length}`);
    allAdmins.forEach((admin, idx) => {
      console.log(`   ${idx + 1}. ${admin.name} (${admin.phone})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addAdminUser();
