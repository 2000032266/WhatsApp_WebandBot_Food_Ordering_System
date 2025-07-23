const express = require('express');
const AdminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

const router = express.Router();

// All routes require super admin authentication
router.use(auth);
router.use(roleCheck(['super_admin']));

// Dashboard
router.get('/dashboard', AdminController.getDashboardStats);

// User management
router.get('/users', AdminController.getUsers);
router.post('/users', AdminController.createUser);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

// Restaurant management
router.get('/restaurants', AdminController.getRestaurants);
router.post('/restaurants', AdminController.createRestaurant);
router.put('/restaurants/:id', AdminController.updateRestaurant);
router.delete('/restaurants/:id', AdminController.deleteRestaurant);

// Order management
router.get('/orders', AdminController.getOrders);
router.get('/orders/:id', AdminController.getOrderDetails);

// Message logs
router.get('/messages', AdminController.getMessages);

// Analytics
router.get('/analytics', AdminController.getAnalytics);

module.exports = router;
