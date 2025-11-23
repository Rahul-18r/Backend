import mongoose from 'mongoose';

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

const RegistrationTeam = mongoose.models.RegistrationTeam || mongoose.model('RegistrationTeam', RegistrationTeamSchema);

export default RegistrationTeam;
