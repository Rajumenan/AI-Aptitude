const dns = require('dns');
// Set custom DNS resolvers to Google Public DNS to resolve MongoDB Atlas SRV query issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables (reloads filesystem .env values on watch reload)
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// Standard Middlewares
app.use(cors({
  origin: "https://ai-aptitude-rho.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Apply global rate limiting to all requests
app.use(apiLimiter);

// Bind Route Files
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/results', require('./routes/results'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Aptitude Quiz Platform API is running smoothly',
    timestamp: new Date()
  });
});

// Also support /api/health for API-prefixed calls
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Aptitude Quiz Platform API is running smoothly',
    timestamp: new Date()
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;

// Export app for testing (server.test.js uses this)
module.exports = app;

// Only start listening if this file is run directly (not imported by tests)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
}
