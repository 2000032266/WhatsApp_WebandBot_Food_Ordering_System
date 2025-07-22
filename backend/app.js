const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
require('dotenv').config({ path: './backend/.env' });

const whatsappRoutes = require('./routes/whatsappRoutes');
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const publicRoutes = require('./routes/publicRoutes');

const notificationRoutes = require('./routes/notificationRoutes');
const notificationServer = require('./utils/notificationServer');

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://8f88a4bec94f.ngrok-free.app',
      'https://whatsappwebandbotfoodorderingsystem-production.up.railway.app'
    ];
    // allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api', publicRoutes);  // Public routes (no auth required)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WhatsApp Food Ordering System API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket notification server
notificationServer.initialize(server);

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WhatsApp webhook endpoint: http://localhost:${PORT}/api/whatsapp/webhook`);
  console.log(`🌐 API base URL: http://localhost:${PORT}/api`);
  console.log(`🔔 Real-time notification server running on ws://localhost:${PORT}`);
});

module.exports = app;



