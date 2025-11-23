import express from 'express';
import { 
    adminLogin, 
    coordinatorLogin, 
    registrationLogin,
    createParticipant, 
    getAllParticipants, 
    getDashboard,
    getParticipantByFestId,
    checkInParticipant
} from '../Admin/adminController.js';
import { protect, isAdmin } from '../middlewares/auth.js';

const adminRouter = express.Router();

// Login routes
adminRouter.post('/admin-login', adminLogin);
adminRouter.post('/coordinator-login', coordinatorLogin);
adminRouter.post('/registration-login', registrationLogin);

// Check-in routes (accessible by admin and registration team)
adminRouter.get('/participant/:festId', protect, getParticipantByFestId);
adminRouter.post('/checkin', protect, checkInParticipant);

// Admin only routes
adminRouter.get('/dashboard', protect, isAdmin, getDashboard);
adminRouter.post('/Create-participants', protect, isAdmin, createParticipant);

// Both admin and coordinator can access (middleware will filter data)
adminRouter.get('/participants', protect, getAllParticipants);

export default adminRouter;