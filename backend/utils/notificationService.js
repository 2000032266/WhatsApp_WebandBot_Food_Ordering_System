const WhatsAppController = require('../controllers/whatsappController');
const Order = require('../models/Order');
const User = require('../models/User');
// WebSocket notification server removed (not in use)

/**
 * Utility function to notify customers about order status changes
 * This can be called from the restaurant controller when an order status is updated
 */
async function notifyCustomerOrderStatusChanged(orderId, newStatus) {
  try {
    // Get order details with customer information
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return false;
    }
    
    // Get customer details
    const customer = {
      id: order.user_id,
      name: order.customer_name,
      phone: order.customer_phone
    };
    
    if (!customer || !customer.phone) {
      console.error(`Customer not found or missing phone number for order: ${orderId}`);
      return false;
    }
    
    // Format status message based on new status
    let statusMessage;
    let statusEmoji;
    
    switch (newStatus) {
      case 'confirmed':
        statusEmoji = '✅';
        statusMessage = 'Your order has been confirmed by the restaurant. It will be prepared shortly.';
        break;
      case 'preparing':
        statusEmoji = '👨‍🍳';
        statusMessage = 'Your order is now being prepared in the kitchen.';
        break;
      case 'ready':
        statusEmoji = '📦';
        statusMessage = 'Your order is ready! Please come to the restaurant to pick up your order/parcel.';
        break;
      case 'delivered':
        statusEmoji = '🎉';
        statusMessage = 'Your order has been picked up. Thank you for visiting us!';
        break;
      case 'cancelled':
        statusEmoji = '❌';
        statusMessage = 'Your order has been cancelled.';
        break;
      default:
        statusEmoji = 'ℹ️';
        statusMessage = `Your order status has been updated to: ${newStatus}`;
    }
    
    // Create notification message
    const notificationMessage = `${statusEmoji} Order #${orderId} Update ${statusEmoji}\n\n` +
      `${statusMessage}\n\n` +
      `🏪 Restaurant: ${order.restaurant_name}\n` +
      `💰 Total Amount: ₹${order.total}\n\n` +
      `Thank you for your order!`;
    
    // WebSocket notification server removed (not in use)
    
    // Send notification via WhatsApp
    console.log(`📱 Sending order status notification to customer ${customer.phone} for order #${orderId}`);
    await WhatsAppController.sendMessage(customer.phone, notificationMessage);
    
    return true;
  } catch (error) {
    console.error('Error notifying customer about order status change:', error);
    return false;
  }
}

module.exports = {
  notifyCustomerOrderStatusChanged
};
