const express = require('express');
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

const router = express.Router();

// All notification routes require authentication
router.use(auth);

// Get notifications for current user (or all for admin)
router.get('/', notificationController.getNotifications);

module.exports = router;
