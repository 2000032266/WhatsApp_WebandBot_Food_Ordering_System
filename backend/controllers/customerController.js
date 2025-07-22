const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

class CustomerController {
  // Get customer orders
  static async getMyOrders(req, res) {
    try {
      const userId = req.user.id;
      
      // Get all orders for the customer
      const orders = await Order.findByUserId(userId);
      
      if (!orders || orders.length === 0) {
        return res.json({
          success: true,
          message: 'No orders found',
          data: []
        });
      }

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await Order.getOrderItems(order.id);
          return { ...order, items };
        })
      );

      res.json({
        success: true,
        message: 'Orders retrieved successfully',
        data: ordersWithItems
      });

    } catch (error) {
      console.error('Get customer orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders'
      });
    }
  }

  // Get order details by ID
  static async getOrderDetails(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify order belongs to the customer
      if (order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get order items
      const orderItems = await Order.getOrderItems(id);

      res.json({
        success: true,
        message: 'Order details retrieved successfully',
        data: {
          ...order,
          items: orderItems
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

  // Update customer profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, phone, email } = req.body;

      const updatedUser = await User.update(userId, {
        name,
        phone,
        email
      });

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update profile'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });

    } catch (error) {
      console.error('Update customer profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  // Create a new order
  static async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { restaurant_id, items, total, delivery_address, notes, payment_method } = req.body;
      
      // Create order
      const orderId = await Order.create({
        user_id: userId,
        restaurant_id,
        total,
        delivery_address,
        notes,
        payment_method: payment_method || 'COD',
        status: 'pending',
        payment_status: 'pending'
      });
      
      // Add order items
      for (const item of items) {
        await Order.addItem(orderId, item.menu_item_id, item.quantity, item.price);
      }
      
      // Get customer details
      const user = await User.findById(userId);
      
      // Get restaurant details
      const restaurant = await Restaurant.findById(restaurant_id);
      
      // Get order items for WhatsApp message
      const orderItems = await Order.getOrderItems(orderId);
      
      // Send WhatsApp notification to both customer and restaurant owner
      try {
        // Import WhatsAppController directly instead of requiring it in the method
        const WhatsAppController = require('./whatsappController');
        
        if (user && user.phone) {
          // Send confirmation to customer
          await WhatsAppController.sendOrderConfirmation(user.phone, {
            orderId,
            restaurantName: restaurant ? restaurant.name : 'Restaurant',
            total,
            items: orderItems,
            deliveryAddress: delivery_address
          });
        }
        
        if (restaurant) {
          // Use owner_phone from the restaurant record
          const restaurantPhone = restaurant.owner_phone || restaurant.phone;
          if (restaurantPhone) {
            // Send notification to restaurant
            await WhatsAppController.sendOrderNotification(restaurantPhone, {
              orderId,
              customerName: user ? user.name : 'Customer',
              customerPhone: user ? user.phone : 'N/A',
              total,
              items: orderItems,
              deliveryAddress: delivery_address,
              notes
            });
          }
        }
      } catch (whatsappError) {
        console.error('WhatsApp notification error:', whatsappError);
        // Continue even if WhatsApp notification fails
      }
      
      res.json({
        success: true,
        message: 'Order created successfully',
        data: {
          orderId
        }
      });
      
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order'
      });
    }
  }
}

module.exports = CustomerController;
