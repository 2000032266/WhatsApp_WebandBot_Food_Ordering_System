const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const User = require('../models/User');
const WhatsAppController = require('./whatsappController');
const db = require('../db/connection');

class RestaurantController {
  // Get restaurant dashboard stats
  static async getDashboardStats(req, res) {
    try {
      const userId = req.user.id;
      
      // Get user's restaurant
      const restaurants = await Restaurant.findByOwnerId(userId);
      if (restaurants.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No restaurant found for this user'
        });
      }

      const restaurant = restaurants[0];
      
      // Get stats for the restaurant
      const stats = await Order.getStats(restaurant.id);
      const todayStats = await Order.getStats(restaurant.id, {
        start: new Date().toISOString().split('T')[0] + ' 00:00:00',
        end: new Date().toISOString().split('T')[0] + ' 23:59:59'
      });


      // Get best sellers (disabled due to MySQL error)
      // let bestSellers = [];
      // try {
      //   bestSellers = await MenuItem.getBestSellers(restaurant.id, 5);
      // } catch (error) {
      //   console.error('Get best sellers error:', error);
      //   // Continue even if best sellers fail
      // }
      const bestSellers = [];

      res.json({
        success: true,
        data: {
          restaurant,
          stats: {
            ...stats,
            today: todayStats
          },
          bestSellers
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard stats'
      });
    }
  }

  // Get restaurant menu
  static async getMenu(req, res) {
    try {
      const userId = req.user.id;
      
      // Get user's restaurant
      const restaurants = await Restaurant.findByOwnerId(userId);
      if (restaurants.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No restaurant found for this user'
        });
      }

      const restaurant = restaurants[0];
      const menuItems = await MenuItem.findByRestaurant(restaurant.id);
      const categories = await MenuItem.getCategories(restaurant.id);

      res.json({
        success: true,
        data: {
          menuItems,
          categories
        }
      });
    } catch (error) {
      console.error('Get menu error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get menu'
      });
    }
  }

  // Create menu item
  static async createMenuItem(req, res) {
    try {
      const userId = req.user.id;
      const { name, description, price, category, image_url } = req.body;

      // Validation
      if (!name || !price) {
        return res.status(400).json({
          success: false,
          message: 'Name and price are required'
        });
      }

      // Get user's restaurant
      const restaurants = await Restaurant.findByOwnerId(userId);
      if (restaurants.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No restaurant found for this user'
        });
      }

      const restaurant = restaurants[0];

      // Create menu item
      const menuItemId = await MenuItem.create({
        restaurant_id: restaurant.id,
        name,
        description,
        price: parseFloat(price),
        category,
        image_url
      });

      res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: {
          menuItemId
        }
      });
    } catch (error) {
      console.error('Create menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create menu item'
      });
    }
  }

  // Update menu item
  static async updateMenuItem(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, category, is_available, image_url } = req.body;

      // Check if menu item exists and belongs to user's restaurant
      const menuItem = await MenuItem.findById(id);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      // Verify ownership
      const restaurants = await Restaurant.findByOwnerId(req.user.id);
      const userRestaurantIds = restaurants.map(r => r.id);
      
      if (!userRestaurantIds.includes(menuItem.restaurant_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Update menu item
      const success = await MenuItem.update(id, {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        category,
        is_available,
        image_url
      });

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update menu item'
        });
      }

      res.json({
        success: true,
        message: 'Menu item updated successfully'
      });
    } catch (error) {
      console.error('Update menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update menu item'
      });
    }
  }

  // Delete menu item
  static async deleteMenuItem(req, res) {
    try {
      const { id } = req.params;

      // Check if menu item exists and belongs to user's restaurant
      const menuItem = await MenuItem.findById(id);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      // Verify ownership
      const restaurants = await Restaurant.findByOwnerId(req.user.id);
      const userRestaurantIds = restaurants.map(r => r.id);
      
      if (!userRestaurantIds.includes(menuItem.restaurant_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Delete menu item
      const success = await MenuItem.delete(id);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete menu item'
        });
      }

      res.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } catch (error) {
      console.error('Delete menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete menu item'
      });
    }
  }

  // Toggle menu item availability
  static async toggleMenuItem(req, res) {
    try {
      const { id } = req.params;

      // Check if menu item exists and belongs to user's restaurant
      const menuItem = await MenuItem.findById(id);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      // Verify ownership
      const restaurants = await Restaurant.findByOwnerId(req.user.id);
      const userRestaurantIds = restaurants.map(r => r.id);
      
      if (!userRestaurantIds.includes(menuItem.restaurant_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Toggle availability
      const success = await MenuItem.toggleAvailability(id);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to toggle menu item'
        });
      }

      res.json({
        success: true,
        message: 'Menu item availability updated'
      });
    } catch (error) {
      console.error('Toggle menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle menu item'
      });
    }
  }

  // Get orders for restaurant
  static async getOrders(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      // Get user's restaurant
      const restaurants = await Restaurant.findByOwnerId(userId);
      if (restaurants.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No restaurant found for this user'
        });
      }

      const restaurant = restaurants[0];
      const orders = await Order.getByRestaurant(restaurant.id, status);

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

  // Update order status
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      // Check if order exists and belongs to user's restaurant
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify ownership
      const restaurants = await Restaurant.findByOwnerId(req.user.id);
      const userRestaurantIds = restaurants.map(r => r.id);
      
      if (!userRestaurantIds.includes(order.restaurant_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Business rule validation: Cannot mark as delivered unless payment is confirmed
      if (status === 'delivered' && order.payment_status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cannot mark order as delivered. Payment must be confirmed first.'
        });
      }

      // Update order status
      const success = await Order.updateStatus(id, status);

      // Create dashboard notification for order status update (for customer and optionally admin)
      try {
        const Notification = require('../models/Notification');
        // Notify customer
        if (order.user_id) {
          await Notification.create({
            type: 'order_status',
            title: `Order #${id} Status Updated`,
            message: `Order #${id} status changed to '${status}' by restaurant.`,
            user_id: order.user_id,
            order_id: id,
            status
          });
        }
        // Optionally, notify admin or others here
      } catch (notifyErr) {
        console.error('Failed to create dashboard notification:', notifyErr);
      }

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update order status'
        });
      }
      
      // Notify customer about order status change
      try {
        const { notifyCustomerOrderStatusChanged } = require('../utils/notificationService');
        await notifyCustomerOrderStatusChanged(id, status);
      } catch (notificationError) {
        console.error('Error sending customer notification:', notificationError);
        // Continue even if notification fails
      }

      res.json({
        success: true,
        message: 'Order status updated successfully'
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status'
      });
    }
  }

  // Update order payment status
  static async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      if (!paymentStatus) {
        return res.status(400).json({
          success: false,
          message: 'Payment status is required'
        });
      }

      // Check if order exists and belongs to user's restaurant
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify ownership
      const restaurants = await Restaurant.findByOwnerId(req.user.id);
      const userRestaurantIds = restaurants.map(r => r.id);
      
      if (!userRestaurantIds.includes(order.restaurant_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Update payment status
      const success = await Order.updatePaymentStatus(id, paymentStatus);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update payment status'
        });
      }

      // Send notification to customer
      try {
        const customer = await User.findById(order.user_id);
        if (customer && customer.phone) {
          // Format status message based on new payment status
          let statusMessage;
          let statusEmoji;
          
          switch (paymentStatus) {
            case 'paid':
              statusEmoji = '💰';
              statusMessage = 'Your payment has been received. Thank you!';
              break;
            case 'refunded':
              statusEmoji = '💸';
              statusMessage = 'Your payment has been refunded.';
              break;
            default:
              statusEmoji = '💱';
              statusMessage = `Your payment status has been updated to: ${paymentStatus}`;
          }
          
          // Create notification message
          const notificationMessage = `${statusEmoji} Order #${id} Payment Update ${statusEmoji}\n\n` +
            `${statusMessage}\n\n` +
            `🏪 Restaurant: ${order.restaurant_name}\n` +
            `💰 Total Amount: ₹${order.total}\n\n` +
            `Thank you for your order!`;
          
          // Send notification via WhatsApp
          console.log(`📱 Sending payment status notification to customer ${customer.phone} for order #${id}`);
          await WhatsAppController.sendMessage(customer.phone, notificationMessage);
        }
      } catch (notificationError) {
        console.error('Error sending customer notification:', notificationError);
        // Continue even if notification fails
      }

      res.json({
        success: true,
        message: 'Payment status updated successfully'
      });
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment status'
      });
    }
  }

  // Get restaurant profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;

      // Get user's restaurant
      const restaurants = await Restaurant.findByOwnerId(userId);
      if (restaurants.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No restaurant found for this user'
        });
      }

      const restaurant = restaurants[0];

      res.json({
        success: true,
        data: {
          restaurant
        }
      });
    } catch (error) {
      console.error('Get restaurant profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get restaurant profile'
      });
    }
  }

  // Update restaurant profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, phone, address } = req.body;
      
      // Validate data
      if (!name && !phone && !address) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (name, phone, or address) is required'
        });
      }
      
      // Validate phone format if provided
      if (phone) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({
            success: false,
            message: 'Phone number must be a 10-digit Indian mobile number'
          });
        }
      }

      // Get user's restaurant
      const restaurants = await Restaurant.findByOwnerId(userId);
      if (restaurants.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No restaurant found for this user'
        });
      }

      const restaurant = restaurants[0];

      // Update restaurant with only the provided fields
      const updateData = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      
      const success = await Restaurant.update(restaurant.id, updateData);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update restaurant profile'
        });
      }

      res.json({
        success: true,
        message: 'Restaurant profile updated successfully'
      });
    } catch (error) {
      console.error('Update restaurant profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update restaurant profile'
      });
    }
  }

  // Download orders as CSV
  static async downloadOrdersCSV(req, res) {
    try {
      const { status, dateFrom, dateTo } = req.query;
      
      // Get user's restaurants
      const restaurants = await Restaurant.findByOwnerId(req.user.id);
      
      if (!restaurants || restaurants.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No restaurants found'
        });
      }

      const restaurantIds = restaurants.map(r => r.id);
      
      // Build query for orders with filters
      let query = `
        SELECT 
          o.id as order_id,
          o.created_at,
          o.status,
          o.payment_status,
          o.total,
          o.delivery_address,
          o.notes,
          u.name as customer_name,
          u.phone as customer_phone,
          r.name as restaurant_name,
          GROUP_CONCAT(
            CONCAT(mi.name, ' (Qty: ', oi.quantity, ', Price: ₹', oi.price, ')')
            ORDER BY mi.name
            SEPARATOR ' | '
          ) as order_items
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN restaurants r ON o.restaurant_id = r.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE o.restaurant_id IN (${restaurantIds.map(() => '?').join(',')})
      `;
      
      const params = [...restaurantIds];
      
      // Add status filter
      if (status && status !== 'all') {
        query += ' AND o.status = ?';
        params.push(status);
      }
      
      // Add date range filter
      if (dateFrom && dateTo) {
        query += ' AND DATE(o.created_at) BETWEEN ? AND ?';
        params.push(dateFrom, dateTo);
      }
      
      query += ' GROUP BY o.id ORDER BY o.created_at DESC';
      
      const [orders] = await db.execute(query, params);
      
      if (!orders || orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No orders found for the specified criteria'
        });
      }

      // Helper function to escape CSV fields
      const escapeCSV = (field) => {
        if (field == null) return '';
        const str = String(field);
        // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Generate CSV content with proper formatting
      const csvHeaders = [
        'Order ID',
        'Order Date',
        'Order Time', 
        'Customer Name',
        'Customer Phone',
        'Restaurant Name',
        'Order Items',
        'Total Amount (₹)',
        'Order Status',
        'Payment Status',
        'Payment Method',
        'Delivery Address',
        'Special Notes'
      ];
      
      let csvContent = csvHeaders.join(',') + '\n';
      
      orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const row = [
          escapeCSV(order.order_id),
          escapeCSV(orderDate.toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
          })),
          escapeCSV(orderDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })),
          escapeCSV(order.customer_name),
          escapeCSV(order.customer_phone),
          escapeCSV(order.restaurant_name),
          escapeCSV(order.order_items || 'No items listed'),
          escapeCSV(order.total),
          escapeCSV(order.status.charAt(0).toUpperCase() + order.status.slice(1)),
          escapeCSV(order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)),
          escapeCSV('Not specified'), // No payment_method in database
          escapeCSV(order.delivery_address || 'No address provided'),
          escapeCSV(order.notes || 'No special notes')
        ];
        csvContent += row.join(',') + '\n';
      });

      // Set response headers for file download
      const filename = `restaurant_orders_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Add BOM for proper Excel UTF-8 support
      const BOM = '\uFEFF';
      res.send(BOM + csvContent);

    } catch (error) {
      console.error('Download orders CSV error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download orders'
      });
    }
  }
}

module.exports = RestaurantController;
