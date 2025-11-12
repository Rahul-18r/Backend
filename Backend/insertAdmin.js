import mongoose from 'mongoose';
import Admin from './models/mainAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

const insertAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    const adminData = {
      name: 'MrAnonymous',
      phone: 8762758490,
      password: 'HelloFriend@159357$'
    };

    const admin = new Admin(adminData);
    await admin.save();
    console.log('Admin inserted successfully');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error inserting admin:', error);
    mongoose.connection.close();
  }
};

insertAdmin();