const express = require('express');
const AuthController = require('../controllers/authController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', auth, AuthController.getProfile);
router.put('/profile', auth, AuthController.updateProfile);
router.put('/change-password', auth, AuthController.changePassword);
router.get('/verify-token', auth, AuthController.verifyToken);

module.exports = router;
