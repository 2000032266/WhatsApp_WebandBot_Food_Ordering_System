const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const db = require('../db/connection');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { name, phone, password, role = 'customer' } = req.body;

      // Validation
      if (!name || !phone || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, phone, and password are required'
        });
      }

      // Validate phone format (10 digits for Indian numbers)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be a 10-digit Indian mobile number'
        });
      }

      // Check if user already exists
      const existingUser = await User.findByPhone(phone);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this phone number already exists'
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = await User.create({
        name,
        phone,
        password: hashedPassword,
        role
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: userId, phone, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: { id: userId, name, phone, role },
          token
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { phone, password } = req.body;

      // Validation
      if (!phone || !password) {
        return res.status(400).json({
          success: false,
          message: 'Phone and password are required'
        });
      }

      // Validate phone format (10 digits for Indian numbers)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be a 10-digit Indian mobile number'
        });
      }

      // Find user
      const user = await User.findByPhone(phone);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Special handling for WhatsApp users with null password
      let isPasswordValid = false;
      
      if (user.password === null) {
        // For WhatsApp users with null password, check against the default password
        const defaultWhatsAppPassword = "whatsapp123";
        isPasswordValid = (password === defaultWhatsAppPassword);
      } else {
        // Normal password check for users with set passwords
        isPasswordValid = await bcrypt.compare(password, user.password);
      }
      
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            created_at: user.created_at,
            password: user.password === null ? null : undefined // Only tell if password is null, never send actual password
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { name } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Name is required'
        });
      }

      // Update user using User model
      const updated = await User.update(userId, { name });
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get updated user
      const updatedUser = await User.findById(userId);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            phone: updatedUser.phone,
            role: updatedUser.role
          }
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Get user with password
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check current password
      let isCurrentPasswordValid = false;
      
      if (user.password === null) {
        // For WhatsApp users with null password, check against the default password
        const defaultWhatsAppPassword = "whatsapp123";
        isCurrentPasswordValid = (currentPassword === defaultWhatsAppPassword);
      } else {
        // Normal password check for users with set passwords
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      }
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const [result] = await db.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update password'
        });
      }

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }

  // Verify token
  static async verifyToken(req, res) {
    try {
      // Token is already verified by auth middleware
      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: req.user
        }
      });
    } catch (error) {
      console.error('Verify token error:', error);
      res.status(500).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  }
}

module.exports = AuthController;
