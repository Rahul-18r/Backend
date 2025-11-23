import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./configs/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/payment.js";
import webhookRoutes from "./routes/webhook.js";
import cors from "cors";

// Config dotenv
dotenv.config();

// Database config
connectDB();

// Initialize express app
const app = express();

// Trust proxy for Render deployment
app.set('trust proxy', true);

// CORS middleware - allow all origins in development, specific + localhost in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [
            'http://localhost:3055',
            'http://localhost:3056',
            'https://sambhram-admin.vercel.app',
            'https://sambhram.sit.ac.in',
            process.env.FRONTEND_URL
          ].filter(Boolean)
        : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Middleware setup
app.use(express.json()); // Middleware for parsing JSON data
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));   // Logging middleware

// Routes
app.use("/api/v1/auth", authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', webhookRoutes);

// Root endpoint
app.get("/", (request, response) => {
    response.json({
        success: true,
        message: "Sambhram Backend API is running",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get("/health", (request, response) => {
    response.json({
        success: true,
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server Running on PORT ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
});

export default app;
