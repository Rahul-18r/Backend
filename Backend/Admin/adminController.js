import spotParticipant from '../models/spotParticipant.js';
import Participant from '../models/Participant.js';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import Admin from '../models/mainAdmin.js';
import Event from '../models/eventModel.js';
import Coordinator from '../models/Coordinator.js';
import RegistrationTeam from '../models/RegistrationTeam.js';

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

// Coordinator login handler
export const coordinatorLogin = asyncHandler(async (req, res) => {
    try {
        const { coordinatorId } = sanitizeInput(req.body);

        console.log('Coordinator login attempt:', { coordinatorId });

        // Find coordinator in the database (case-insensitive search)
        const coordinator = await Coordinator.findOne({ 
            coordinatorId: { $regex: new RegExp(`^${coordinatorId.trim()}$`, 'i') },
            isActive: true
        });

        if (!coordinator) {
            console.log('Coordinator not found', { coordinatorId });
            return handleError(res, {
                message: 'Invalid coordinator ID',
                code: 'AUTH_FAILED'
            }, 401);
        }

        // Update last login
        coordinator.lastLogin = new Date();
        await coordinator.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                id: coordinator._id,
                coordinatorId: coordinator.coordinatorId,
                name: coordinator.name,
                eventId: coordinator.eventId,
                eventName: coordinator.eventName,
                role: 'coordinator'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '12h' }
        );

        console.log('Coordinator login successful', { name: coordinator.name, event: coordinator.eventName });

        return sendResponse(res, {
            message: 'Login successful',
            token,
            coordinator: {
                name: coordinator.name,
                coordinatorId: coordinator.coordinatorId,
                eventName: coordinator.eventName,
                eventType: coordinator.eventType,
                role: 'coordinator'
            }
        });

    } catch (error) {
        console.error('Coordinator login error:', error);
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

    // Check if user is coordinator or admin
    const userRole = req.user?.role;
    const userEventId = req.user?.eventId;

    console.log(`[${new Date().toISOString()}] Fetching participants for ${userRole}...`);

    // CACHE DISABLED - Always fetch fresh data from MongoDB for real-time updates
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

    // Combine participants
    let combinedParticipants = [...regularParticipants, ...spotParticipants]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);

    // Populate event names for all participants
    let participantsWithEventNames = await Promise.all(
        combinedParticipants.map(async (participant) => {
            if (participant.registrations && participant.registrations.length > 0) {
                const registrationsWithNames = await Promise.all(
                    participant.registrations.map(async (registration) => {
                        try {
                            const event = await Event.findById(registration.event_id).lean();
                            return {
                                ...registration,
                                eventName: event ? event.eventName : 'Unknown Event'
                            };
                        } catch (error) {
                            console.error(`Error fetching event ${registration.event_id}:`, error);
                            return {
                                ...registration,
                                eventName: 'Unknown Event'
                            };
                        }
                    })
                );
                return {
                    ...participant,
                    registrations: registrationsWithNames
                };
            }
            return participant;
        })
    );

    // Filter by event if user is coordinator
    if (userRole === 'coordinator' && userEventId) {
        participantsWithEventNames = participantsWithEventNames.filter(participant => {
            return participant.registrations && participant.registrations.some(reg => 
                reg.event_id.toString() === userEventId.toString()
            );
        });
        console.log(`[${new Date().toISOString()}] Filtered to ${participantsWithEventNames.length} participants for coordinator's event`);
    }

    // Calculate totals after filtering
    const totalFiltered = participantsWithEventNames.length;
    const [regularTotal, spotTotal] = await Promise.all([
        Participant.countDocuments(),
        spotParticipant.countDocuments()
    ]);

    console.log(`[${new Date().toISOString()}] Found ${totalFiltered} participants (${regularTotal} regular + ${spotTotal} spot)`);

    const data = {
        participants: participantsWithEventNames,
        pagination: {
            current: page,
            total: Math.ceil(totalFiltered / limit),
            hasMore: page * limit < totalFiltered,
            totalParticipants: totalFiltered
        },
        summary: {
            regularParticipants: regularTotal,
            spotParticipants: spotTotal
        },
        userRole: userRole,
        eventFilter: userRole === 'coordinator' ? req.user.eventName : null
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

// Registration Team Login
export const registrationLogin = asyncHandler(async (req, res) => {
    try {
        const { username } = sanitizeInput(req.body);

        console.log('Registration team login attempt:', { username });

        const regTeam = await RegistrationTeam.findOne({ 
            username: username.trim().toLowerCase(),
            isActive: true
        });

        if (!regTeam) {
            console.log('Registration team member not found', { username });
            return handleError(res, {
                message: 'Invalid username',
                code: 'AUTH_FAILED'
            }, 401);
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: regTeam._id,
                username: regTeam.username,
                name: regTeam.name,
                role: 'registration'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '12h' }
        );

        console.log('Registration team login successful', { name: regTeam.name });

        return sendResponse(res, {
            message: 'Login successful',
            token,
            user: {
                name: regTeam.name,
                username: regTeam.username,
                role: 'registration'
            }
        });

    } catch (error) {
        console.error('Registration team login error:', error);
        return handleError(res, {
            message: 'Login process failed',
            code: 'LOGIN_ERROR',
            details: error.message
        }, 500);
    }
});

// Get participant by Fest ID
export const getParticipantByFestId = asyncHandler(async (req, res) => {
    try {
        const { festId } = req.params;

        console.log(`Fetching participant with Fest ID: ${festId}`);

        // Search in both collections by ticketUid or order_id
        let participant = await Participant.findOne({ 
            $or: [
                { ticketUid: festId },
                { 'registrations.order_id': festId }
            ]
        }).lean();
        let source = 'regular';

        if (!participant) {
            participant = await spotParticipant.findOne({ 
                $or: [
                    { ticketUid: festId },
                    { 'registrations.order_id': festId }
                ]
            }).lean();
            source = 'spot';
        }

        if (!participant) {
            console.log(`Participant not found with ID: ${festId}`);
            return handleError(res, {
                message: 'Participant not found',
                code: 'NOT_FOUND'
            }, 404);
        }

        console.log(`Found participant: ${participant.name} (${source})`);

        // Populate event names
        if (participant.registrations && participant.registrations.length > 0) {
            const registrationsWithNames = await Promise.all(
                participant.registrations.map(async (registration) => {
                    try {
                        const event = await Event.findById(registration.event_id).lean();
                        return {
                            ...registration,
                            eventName: event ? event.eventName : 'Unknown Event'
                        };
                    } catch (error) {
                        return {
                            ...registration,
                            eventName: 'Unknown Event'
                        };
                    }
                })
            );
            participant.registrations = registrationsWithNames;
        }

        return sendResponse(res, {
            participant,
            source
        });

    } catch (error) {
        console.error('Error fetching participant:', error);
        return handleError(res, {
            message: 'Failed to fetch participant',
            code: 'FETCH_ERROR',
            details: error.message
        }, 500);
    }
});

// Check-in participant
export const checkInParticipant = asyncHandler(async (req, res) => {
    try {
        const { festId } = sanitizeInput(req.body);

        console.log(`Check-in attempt for Fest ID: ${festId}`);

        // Search in both collections by ticketUid, order_id, or phone number
        let participant = await Participant.findOne({ 
            $or: [
                { ticketUid: festId },
                { 'registrations.order_id': festId },
                { phone: festId }
            ]
        });
        let source = 'regular';
        let Model = Participant;

        if (!participant) {
            participant = await spotParticipant.findOne({ 
                $or: [
                    { ticketUid: festId },
                    { 'registrations.order_id': festId },
                    { phone: festId }
                ]
            });
            source = 'spot';
            Model = spotParticipant;
        }

        if (!participant) {
            console.log(`Participant not found with ID/Phone: ${festId}`);
            return handleError(res, {
                message: 'Participant not found. Please check the Ticket ID, Order ID, or Phone Number.',
                code: 'NOT_FOUND'
            }, 404);
        }

        console.log(`Found participant: ${participant.name} (Source: ${source})`);

        // Define group events
        const groupEvents = [
            'SHARK TANK', 'GERBER BATTLE', 'LUMINARY DESIGNS', 'AQUA IGNITION', 'FLIGHT EMBERS',
            'KOHJ KSHETRA', 'AGNI CHAKRAVYUHA', 'VEERA SAMARA', 'TAAL YUDHA',
            'SANGEETH SPARSH', 'BHAVA SPHRUTHI', 'NRITHYA PARVA', 'SHAKTHI SANGRAM'
        ];

        // Check if participant is registered for any group event
        let isGroupEvent = false;
        let groupEventIds = [];
        if (participant.registrations && participant.registrations.length > 0) {
            for (const reg of participant.registrations) {
                try {
                    const event = await Event.findById(reg.event_id).lean();
                    if (event && groupEvents.includes(event.eventName.toUpperCase())) {
                        isGroupEvent = true;
                        groupEventIds.push(reg.event_id.toString());
                    }
                } catch (error) {
                    console.error('Error checking event:', error);
                }
            }
        }

        // Check if already checked in
        if (participant.check_in) {
            // Get event names for response
            let eventNames = [];
            if (participant.registrations && participant.registrations.length > 0) {
                const events = await Promise.all(
                    participant.registrations.map(async (reg) => {
                        try {
                            const event = await Event.findById(reg.event_id).lean();
                            return event ? event.eventName : 'Unknown Event';
                        } catch (error) {
                            return 'Unknown Event';
                        }
                    })
                );
                eventNames = events.filter(Boolean);
            }

            return sendResponse(res, {
                message: 'Participant already checked in',
                alreadyCheckedIn: true,
                participant: {
                    name: participant.name,
                    festId: participant.ticketUid,
                    phone: participant.phone,
                    college: participant.college,
                    events: eventNames,
                    check_in: participant.check_in,
                    check_in_time: participant.check_in_time
                }
            });
        }

        // Mark as checked in
        participant.check_in = true;
        participant.check_in_time = new Date();
        await participant.save({ validateBeforeSave: false });

        let checkedInCount = 1;
        let teamMembersCheckedIn = [];

        // If group event, check in all team members
        if (isGroupEvent && groupEventIds.length > 0) {
            console.log(`Group event detected. Checking in team members...`);
            
            // Find all participants registered for the same group event(s)
            const teamMembers = await Model.find({
                'registrations.event_id': { $in: groupEventIds.map(id => new mongoose.Types.ObjectId(id)) },
                _id: { $ne: participant._id }, // Exclude current participant
                check_in: { $ne: true } // Only check in those not already checked in
            });

            console.log(`Found ${teamMembers.length} team members to check in`);

            // Check in all team members
            for (const member of teamMembers) {
                member.check_in = true;
                member.check_in_time = new Date();
                await member.save({ validateBeforeSave: false });
                teamMembersCheckedIn.push(member.name);
                checkedInCount++;
            }

            console.log(`Checked in ${checkedInCount} participants (including team members)`);
        }

        // Get event names
        let eventNames = [];
        if (participant.registrations && participant.registrations.length > 0) {
            const events = await Promise.all(
                participant.registrations.map(async (reg) => {
                    try {
                        const event = await Event.findById(reg.event_id).lean();
                        return event ? event.eventName : 'Unknown Event';
                    } catch (error) {
                        return 'Unknown Event';
                    }
                })
            );
            eventNames = events.filter(Boolean);
        }

        console.log(`Successfully checked in: ${participant.name}`);

        const responseMessage = isGroupEvent && teamMembersCheckedIn.length > 0
            ? `Check-in successful! ${checkedInCount} team member(s) checked in`
            : 'Check-in successful';

        return sendResponse(res, {
            message: responseMessage,
            alreadyCheckedIn: false,
            isGroupEvent: isGroupEvent,
            checkedInCount: checkedInCount,
            teamMembers: teamMembersCheckedIn,
            participant: {
                name: participant.name,
                festId: participant.ticketUid,
                phone: participant.phone,
                college: participant.college,
                events: eventNames,
                check_in: participant.check_in,
                check_in_time: participant.check_in_time
            }
        });

    } catch (error) {
        console.error('Check-in error:', error);
        return handleError(res, {
            message: 'Check-in failed',
            code: 'CHECKIN_ERROR',
            details: error.message
        }, 500);
    }
});

// ...existing code...
