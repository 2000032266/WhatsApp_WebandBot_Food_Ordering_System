const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');
const auth = require('../middlewares/auth');

// Middleware to ensure only customers can access these routes
const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer only.'
    });
  }
  next();
};

// Apply auth middleware to all routes
router.use(auth);
// Enable customer role check for production
router.use(customerOnly);

// Get customer's orders
router.get('/orders', CustomerController.getMyOrders);

// Get specific order details
router.get('/orders/:id', CustomerController.getOrderDetails);

// Create a new order
router.post('/orders', CustomerController.createOrder);

// Update customer profile
router.put('/profile', CustomerController.updateProfile);

module.exports = router;
