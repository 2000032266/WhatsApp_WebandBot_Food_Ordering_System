const express = require('express');
const RestaurantController = require('../controllers/restaurantController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

const router = express.Router();

// All routes require restaurant owner authentication  
router.use(auth);
router.use(roleCheck(['restaurant_owner', 'super_admin']));

// Dashboard
router.get('/dashboard', RestaurantController.getDashboardStats);

// Restaurant profile
router.get('/profile', RestaurantController.getProfile);
router.put('/profile', RestaurantController.updateProfile);

// Menu management
router.get('/menu', RestaurantController.getMenu);
router.post('/menu', RestaurantController.createMenuItem);
router.put('/menu/:id', RestaurantController.updateMenuItem);
router.delete('/menu/:id', RestaurantController.deleteMenuItem);
router.patch('/menu/:id/toggle', RestaurantController.toggleMenuItem);

// Order management
router.get('/orders', RestaurantController.getOrders);
router.put('/orders/:id/status', RestaurantController.updateOrderStatus);
router.put('/orders/:id/payment', RestaurantController.updatePaymentStatus);

// Download orders as CSV
router.get('/orders/download/csv', RestaurantController.downloadOrdersCSV);

module.exports = router;
