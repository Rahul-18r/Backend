import mongoose from 'mongoose';
import Admin from './models/mainAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        // Check if admin exists
        const admin = await Admin.findOne({ name: 'root' }).select('+password');
        
        if (admin) {
            console.log('\n✅ Admin found:');
            console.log('Name:', admin.name);
            console.log('Phone:', admin.phone);
            console.log('Password:', admin.password);
        } else {
            console.log('\n❌ Admin "root" not found in database');
            console.log('\nCreating admin account...');
            
            const newAdmin = await Admin.create({
                name: 'root',
                phone: '1234567890',
                password: 'root'
            });
            
            console.log('✅ Admin created successfully!');
            console.log('Name:', newAdmin.name);
            console.log('Password: root');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAdmin();
