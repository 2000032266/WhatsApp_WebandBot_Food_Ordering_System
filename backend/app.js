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
// WebSocket notification server removed (not in use)

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://8f88a4bec94f.ngrok-free.app'
  ],
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

// Serve frontend build for all non-API routes
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// WebSocket notification server removed (not in use)

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WhatsApp webhook endpoint: http://localhost:${PORT}/api/whatsapp/webhook`);
  console.log(`🌐 API base URL: http://localhost:${PORT}/api`);
  // WebSocket notification server removed (not in use)
});

module.exports = app;



