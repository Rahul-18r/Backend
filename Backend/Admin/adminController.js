import spotParticipant from '../models/spotParticipant.js';
import Participant from '../models/Participant.js';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import Admin from '../models/mainAdmin.js';

// Enhanced cache configuration
const cache = new NodeCache({
    stdTTL: 300,
    checkperiod: 320,
    useClones: false
});

// Helper functions
const handleError = (res, error, status = 500) => {
    console.error(`[${new Date().toISOString()}] Error:`, {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return res.status(status).json({
        success: false,
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
    });
};

const sendResponse = (res, data, status = 200) => {
    return res.status(status).json({
        success: true,
        timestamp: new Date().toISOString(),
        ...data
    });
};

// Sanitize input
const sanitizeInput = (obj) => {
    return Object.keys(obj).reduce((acc, key) => {
        acc[key] = typeof obj[key] === 'string'
            ? obj[key].trim().replace(/[<>]/g, '')
            : obj[key];
        return acc;
    }, {});
};

// Wrapper for async handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => handleError(res, error));
};

// Simple login handler without rate limiting
export const adminLogin = asyncHandler(async (req, res) => {
    try {
            const { contact, password, name } = sanitizeInput(req.body);

            console.log('Login data:', { contact, password, name });

            // Find admin in the database
            const adminData = await Admin.findOne({ 
                name: name.trim(),
                phone: contact
            }).select('+password');

            if (!adminData) {
                console.log('Admin not found', { contact});
                return handleError(res, {
                    message: 'Invalid credentials',
                    code: 'AUTH_FAILED'
                }, 401);
            }

            // Check if the password is correct
            if (password !== adminData.password) {
                console.log('Incorrect password', { contact});
                return handleError(res, {
                    message: 'Invalid credentials',
                    code: 'AUTH_FAILED'
                }, 401);
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    name: adminData.name,
                    contact: adminData.phone,
                    role: 'admin'
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '12h' }
            );
            console.log('Login successful', { name });

            return sendResponse(res, {
                message: 'Login successful',
                token,
                admin: {
                    name: adminData.name,
                    phone: adminData.phone,
                    role: 'admin'
                }
            });

        } catch (error) {
            console.error('Detailed login error:', error);
            return handleError(res, {
                message: 'Login process failed',
                code: 'LOGIN_ERROR',
                details: error.message
            }, 500);
        }
});

export const createParticipant = asyncHandler(async (req, res) => {
    const sanitizedData = sanitizeInput(req.body);
    const { name, usn, phone, college, registrations } = sanitizedData;

    if (!name || !usn || !phone || !college || !registrations) {
        return handleError(res, new Error('All fields are required'), 400);
    }

    // Clear participants cache on new entry
    cache.del('all_participants');

    const newParticipant = await spotParticipant.create({
        name, usn, phone, college, registrations
    }).catch(error => {
        if (error.code === 11000) {
            throw new Error('Duplicate entry found');
        }
        throw error;
    });

    return sendResponse(res,
        { message: 'Participant created successfully', participant: newParticipant },
        201
    );
});

// Optimize getAllParticipants with pagination - NO CACHE for real-time updates
export const getAllParticipants = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Increased limit to get all participants

    // CACHE DISABLED - Always fetch fresh data from MongoDB for real-time updates
    console.log(`[${new Date().toISOString()}] Fetching fresh participant data from MongoDB...`);

    // Calculate total counts from both collections
    const [regularTotal, spotTotal] = await Promise.all([
        Participant.countDocuments(),
        spotParticipant.countDocuments()
    ]);

    const totalDocs = regularTotal + spotTotal;
    const skip = (page - 1) * limit;

    // Fetch data from both collections
    const [regularParticipants, spotParticipants] = await Promise.all([
        Participant.find()
            .select('-__v')
            .lean()
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 }),
        spotParticipant.find()
            .select('-__v')
            .lean()
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 })
    ]);

    // Combine and sort by creation date
    const combinedParticipants = [...regularParticipants, ...spotParticipants]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit); // Ensure we only return the requested limit

    console.log(`[${new Date().toISOString()}] Found ${combinedParticipants.length} total participants (${regularTotal} regular + ${spotTotal} spot)`);

    const data = {
        participants: combinedParticipants,
        pagination: {
            current: page,
            total: Math.ceil(totalDocs / limit),
            hasMore: page * limit < totalDocs,
            totalParticipants: totalDocs
        },
        summary: {
            regularParticipants: regularTotal,
            spotParticipants: spotTotal
        }
    };

    // NO CACHING - Real-time data only
    return sendResponse(res, data);
});

// Get Dashboard Data - Protected Route
export const getDashboard = asyncHandler(async (req, res) => {
    try {
        // Get coordinator info from JWT (set by protect middleware)
        const coordinatorContact = req.user.contact;
        
        // Find coordinator details
        const coordinator = await Admin.findOne({ phone: coordinatorContact })
            .select('-password')
            .lean();

        if (!coordinator) {
            return handleError(res, {
                message: 'Coordinator not found',
                code: 'NOT_FOUND'
            }, 404);
        }

        // Calculate statistics from both collections
        const [regularTotal, spotTotal] = await Promise.all([
            Participant.countDocuments(),
            spotParticipant.countDocuments()
        ]);

        // Fetch sample participants for revenue calculation
        const [regularParticipants, spotParticipants] = await Promise.all([
            Participant.find().select('registrations').lean().limit(1000),
            spotParticipant.find().select('registrations').lean().limit(1000)
        ]);

        const allParticipants = [...regularParticipants, ...spotParticipants];

        // Calculate stats
        let totalRevenue = 0;
        let totalEvents = 0;
        let paidCount = 0;
        let pendingCount = 0;

        allParticipants.forEach(participant => {
            if (participant.registrations && participant.registrations.length > 0) {
                participant.registrations.forEach(reg => {
                    totalEvents++;
                    totalRevenue += reg.amount || 0;
                    if (reg.payment_status === 'paid') {
                        paidCount++;
                    } else if (reg.payment_status === 'pending') {
                        pendingCount++;
                    }
                });
            }
        });

        const dashboardData = {
            coordinator: {
                name: coordinator.name,
                phone: coordinator.phone,
                role: 'admin'
            },
            stats: {
                totalParticipants: regularTotal + spotTotal,
                totalEvents: totalEvents,
                totalRevenue: totalRevenue,
                paidCount: paidCount,
                pendingCount: pendingCount
            },
            timestamp: new Date().toISOString()
        };

        return sendResponse(res, {
            message: 'Dashboard data retrieved successfully',
            data: dashboardData
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        return handleError(res, {
            message: 'Failed to load dashboard data',
            code: 'DASHBOARD_ERROR',
            details: error.message
        }, 500);
    }
});

// ...existing code...
