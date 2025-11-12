// middleware/auth.js
import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');

    if (!token) {
        console.log('Auth middleware - No token provided');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Auth middleware - Token decoded:', decoded);
        req.user = { 
            contact: decoded.contact, 
            role: decoded.role,
            name: decoded.name 
        };
        console.log('Auth middleware - User set:', req.user);
        next();
    } catch (error) {
        console.error('Auth middleware - Token verification failed:', error.message);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export const isAdmin = (req, res, next) => {
    console.log('isAdmin middleware - Checking user:', req.user);
    if (req.user && req.user.role === 'admin') {
        console.log('isAdmin middleware - Access granted');
        next();
    } else {
        console.log('isAdmin middleware - Access denied');
        res.status(403).json({ message: 'Access denied' });
    }
};