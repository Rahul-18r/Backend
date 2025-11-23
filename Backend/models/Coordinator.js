import mongoose from 'mongoose';

const coordinatorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    coordinatorId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    eventName: {
        type: String,
        required: true,
        trim: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    eventType: {
        type: String,
        enum: ['technical', 'cultural'],
        required: true
    },
    role: {
        type: String,
        default: 'coordinator',
        enum: ['coordinator']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for faster queries
coordinatorSchema.index({ eventId: 1 });

const Coordinator = mongoose.model('Coordinator', coordinatorSchema);

export default Coordinator;
