const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Message = require('../models/Message');
const bcrypt = require('bcryptjs');

class AdminController {
  // Get admin dashboard stats
  static async getDashboardStats(req, res) {
    try {
      // Overall system stats
      const restaurantStats = await Restaurant.getStats();
      const orderStats = await Order.getStats();
      const messageStats = await Message.getStats();
      
      // Today's stats
      const todayStats = await Order.getStats(null, {
        start: new Date().toISOString().split('T')[0] + ' 00:00:00',
        end: new Date().toISOString().split('T')[0] + ' 23:59:59'
      });

      // Recent orders
      const recentOrders = await Order.getAll({ limit: 10 });

      // Best selling items across all restaurants
      // const bestSellers = await MenuItem.getBestSellers(null, 10); // Disabled for now
      const bestSellers = []; // Disabled: do not show best sellers on dashboard

      res.json({
        success: true,
        data: {
          stats: {
            restaurants: restaurantStats,
            orders: orderStats,
            messages: messageStats,
            today: todayStats
          },
          recentOrders,
          bestSellers
        }
      });
    } catch (error) {
      console.error('Get admin dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard stats'
      });
    }
  }

  // Get all users
  static async getUsers(req, res) {
    try {
      const { role } = req.query;
      const users = await User.getAll(role);
      res.json({
        success: true,
        data: {
          users
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }

  // Create new user
  static async createUser(req, res) {
    try {
      const { name, phone, password, role } = req.body;

      // Validation
      if (!name || !phone || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
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

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          userId
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  }

  // Update existing user
  static async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const { name, phone, password, role } = req.body;

      // Validation
      if (!name || !phone || !role) {
        return res.status(400).json({
          success: false,
          message: 'Name, phone, and role are required'
        });
      }

      // Get existing user
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if phone number already exists for a different user
      if (phone !== existingUser.phone) {
        const phoneExists = await User.findByPhone(phone);
        if (phoneExists) {
          return res.status(400).json({
            success: false,
            message: 'Another user with this phone number already exists'
          });
        }
      }

      // Prepare update data
      const updateData = { name, phone, role };

      // Update password if provided
      if (password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(password, saltRounds);
      }

      // Update user
      await User.update(userId, updateData);

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent deleting super admins
      if (user.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete super admin'
        });
      }

      // Delete user
      const success = await User.delete(id);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete user'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }

  // Get all restaurants
  static async getRestaurants(req, res) {
    try {
      const restaurants = await Restaurant.getAll();

      res.json({
        success: true,
        data: {
          restaurants
        }
      });
    } catch (error) {
      console.error('Get restaurants error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get restaurants'
      });
    }
  }

  // Create new restaurant
  static async createRestaurant(req, res) {
    try {
      const { name, owner_id, phone, address } = req.body;

      // Validation
      if (!name || !owner_id) {
        return res.status(400).json({
          success: false,
          message: 'Name and owner ID are required'
        });
      }

      // Check if owner exists and is a restaurant owner
      const owner = await User.findById(owner_id);
      if (!owner) {
        return res.status(404).json({
          success: false,
          message: 'Owner not found'
        });
      }

      if (owner.role !== 'restaurant_owner') {
        return res.status(400).json({
          success: false,
          message: 'Owner must have restaurant_owner role'
        });
      }

      // Create restaurant
      const restaurantId = await Restaurant.create({
        name,
        owner_id,
        phone,
        address
      });

      res.status(201).json({
        success: true,
        message: 'Restaurant created successfully',
        data: {
          restaurantId
        }
      });
    } catch (error) {
      console.error('Create restaurant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create restaurant'
      });
    }
  }

  // Update restaurant
  static async updateRestaurant(req, res) {
    try {
      const { id } = req.params;
      const { name, phone, address, is_active } = req.body;

      // Check if restaurant exists
      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found'
        });
      }

      // Update restaurant
      const success = await Restaurant.update(id, {
        name,
        phone,
        address,
        is_active
      });

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update restaurant'
        });
      }

      res.json({
        success: true,
        message: 'Restaurant updated successfully'
      });
    } catch (error) {
      console.error('Update restaurant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update restaurant'
      });
    }
  }

  // Delete restaurant
  static async deleteRestaurant(req, res) {
    try {
      const { id } = req.params;

      // Check if restaurant exists
      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found'
        });
      }

      // Delete restaurant
      const success = await Restaurant.delete(id);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete restaurant'
        });
      }

      res.json({
        success: true,
        message: 'Restaurant deleted successfully'
      });
    } catch (error) {
      console.error('Delete restaurant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete restaurant'
      });
    }
  }

  // Get all orders
  static async getOrders(req, res) {
    try {
      const { status, payment_status, restaurant_id } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (payment_status) filters.payment_status = payment_status;
      if (restaurant_id) filters.restaurant_id = restaurant_id;

      const orders = await Order.getAll(filters);

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await Order.getOrderItems(order.id);
          return { ...order, items };
        })
      );

      res.json({
        success: true,
        data: {
          orders: ordersWithItems
        }
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders'
      });
    }
  }

  // Get order details
  static async getOrderDetails(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const items = await Order.getOrderItems(id);

      res.json({
        success: true,
        data: {
          order: { ...order, items }
        }
      });
    } catch (error) {
      console.error('Get order details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order details'
      });
    }
  }

  // Get messages/conversation logs
  static async getMessages(req, res) {
    try {
      const { phone, type, dateFrom, dateTo, limit = 100 } = req.query;
      
      const filters = { limit: parseInt(limit) };
      if (phone) filters.phone = phone;
      if (type) filters.type = type;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const messages = await Message.getAll(filters);

      res.json({
        success: true,
        data: {
          messages
        }
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get messages'
      });
    }
  }

  // Get analytics data
  static async getAnalytics(req, res) {
    try {
      const { period = '7days' } = req.query;
      
      let dateRange = {};
      const now = new Date();
      
      switch (period) {
        case '24hours':
          dateRange.start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7days':
          dateRange.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30days':
          dateRange.start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          dateRange.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      
      dateRange.end = now.toISOString();

      // Get analytics data
      const orderStats = await Order.getStats(null, dateRange);
      const topRestaurants = await Restaurant.getAll();
      const bestSellers = await MenuItem.getBestSellers(null, 10);

      res.json({
        success: true,
        data: {
          period,
          orderStats,
          topRestaurants: topRestaurants.slice(0, 5),
          bestSellers
        }
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics'
      });
    }
  }
}

module.exports = AdminController;
