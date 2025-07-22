const twilio = require('twilio');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Initialize Twilio client only if credentials are provided
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio WhatsApp client initialized');
} else {
  console.warn('⚠️  Twilio credentials not configured. WhatsApp features will be in simulation mode.');
}

// In-memory session storage (use Redis in production)
const userSessions = new Map();

class WhatsAppController {
  // Helper method to send a WhatsApp message
  static async sendMessage(to, body) {
    try {
      // Format phone number for Twilio (add whatsapp: prefix and country code if needed)
      let formattedPhone = to;
      if (!formattedPhone.startsWith('+')) {
        // Assuming Indian number
        formattedPhone = `+91${formattedPhone}`;
      }
      
      // Add WhatsApp protocol
      if (!formattedPhone.startsWith('whatsapp:')) {
        formattedPhone = `whatsapp:${formattedPhone}`;
      }
      
      // Log in simulation mode if client is not initialized
      if (!client) {
        console.log(`SIMULATION - Sending WhatsApp message to ${formattedPhone}: ${body}`);
        return { sid: 'SIMULATED_SID', status: 'simulated' };
      }
      
      // Send via Twilio
      const message = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886', // Default Twilio sandbox number
        to: formattedPhone,
        body: body
      });
      
      console.log(`WhatsApp message sent to ${formattedPhone}, SID: ${message.sid}`);
      return message;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }
  
  // Send order confirmation to customer
  static async sendOrderConfirmation(phone, orderData) {
    try {
      const { orderId, restaurantName, total, items, deliveryAddress } = orderData;
      
      // Format items for the message
      const itemsList = items.map(item => `• ${item.quantity}x ${item.item_name || 'Item'} - ₹${item.price * item.quantity}`).join('\n');
      
      // Create message content
      const message = `🎉 Your order has been placed successfully!

*Order #${orderId} - ${restaurantName}*

📋 *Order Details:*
${itemsList}

💰 *Total Amount:* ₹${total}

🏠 *Delivery Address:*
${deliveryAddress}

🚚 *Delivery Status:* Your order is pending confirmation by the restaurant. We'll update you when it's confirmed.

Thank you for ordering through our platform!`;

      // Send the message
      return await WhatsAppController.sendMessage(phone, message);
    } catch (error) {
      console.error('Error sending order confirmation WhatsApp:', error);
      throw error;
    }
  }
  
  // Send order notification to restaurant
  static async sendOrderNotification(phone, orderData) {
    try {
      const { orderId, customerName, customerPhone, total, items, deliveryAddress, notes } = orderData;
      
      // Format items for the message
      const itemsList = items.map(item => `• ${item.quantity}x ${item.item_name || 'Item'} - ₹${item.price * item.quantity}`).join('\n');
      
      // Create message content
      const message = `🔔 New Order Alert! (Web Order)

*Order #${orderId}*

👤 *Customer:* ${customerName}
📱 *Phone:* ${customerPhone}

📋 *Order Items:*
${itemsList}

💰 *Total Amount:* ₹${total}

🏠 *Delivery Address:*
${deliveryAddress}

${notes ? `📝 *Notes:* ${notes}` : ''}

Please confirm this order in your restaurant dashboard or reply to this message.`;

      // Send the message
      return await WhatsAppController.sendMessage(phone, message);
    } catch (error) {
      console.error('Error sending restaurant notification WhatsApp:', error);
      throw error;
    }
  }
  static async handleNameInput(phone, message, session) {
    try {
      // Clean phone number to ensure 10 digits
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = cleanPhone.substring(2);
      }

      // Check for greetings and ask for real name if detected
      const greetings = ['hi', 'hello', 'hey', 'hii', 'hai', 'yo', 'hola', 'namaste', 'greetings'];
      const msgLower = message.trim().toLowerCase();
      if (greetings.includes(msgLower)) {
        await WhatsAppController.sendMessage(cleanPhone, "👋 Welcome! Please tell me your full name to get started:");
        return;
      }

      // Save name to session
      session.name = message;
      session.state = 'ask_location';
      userSessions.set(cleanPhone, session);

      // Ask for location
      await WhatsAppController.sendMessage(cleanPhone, `Thanks ${message}! Please share your current location to help us find restaurants near you:`);

    } catch (error) {
      console.error('Error in handleNameInput:', error);
      throw error;
    }
  }

  static async handleLocationInput(phone, message, session) {
    try {
      // Clean phone number to ensure 10 digits
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = cleanPhone.substring(2);
      }

      // Save location to session
      session.location = message;
      session.state = 'welcome';
      userSessions.set(cleanPhone, session);

      // Send message about restaurant selection
      await WhatsAppController.sendMessage(cleanPhone, `Great! Now please choose a restaurant near ${message}:`);

      // Show restaurants list using welcome handler
      await WhatsAppController.handleWelcome(cleanPhone, session);

    } catch (error) {
      console.error('Error in handleLocationInput:', error);
      throw error;
    }
  }

  // Main webhook handler for incoming messages
  static async webhook(req, res) {
    try {
      const { From, Body, ButtonPayload, MessageSid } = req.body;
      
      // Extract phone number and remove "whatsapp:" prefix if present
      let phone = From;
      if (phone && phone.startsWith('whatsapp:')) {
        phone = phone.replace('whatsapp:', '');
      }
      // Remove '+' if present and clean number
      if (phone && phone.startsWith('+')) {
        phone = phone.substring(1);
      }
      
      // Clean to get 10-digit Indian number (remove 91 prefix if present)
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = cleanPhone.substring(2);
      }
      
      console.log('📱 WhatsApp message received:', { phone: cleanPhone, body: Body, buttonPayload: ButtonPayload });

      // Log incoming message
      if (Body) {
        await Message.create({
          phone: cleanPhone,
          message: Body,
          type: 'incoming',
          message_sid: MessageSid
        });
      }

      // Find user to check if they are a restaurant owner
      let user = await User.findByPhone(cleanPhone);

      // Check if this is an order management command from a restaurant owner
      if (Body && user && user.role === 'restaurant_owner') {
        const isOrderCommand = await WhatsAppController.handleOwnerOrderCommand(cleanPhone, Body.trim(), user);
        if (isOrderCommand) {
          res.status(200).send('OK');
          return; // Don't proceed with normal food ordering flow
        }
      }

      // Get or create user session using cleanPhone
      let session = userSessions.get(cleanPhone);
      
      // If no session exists, create a new one
      if (!session) {
        session = {
          state: 'ask_name',
          cart: [],
          selectedRestaurant: null,
          currentCategoryItems: null,
          categories: [],
          menuItems: []
        };
        await WhatsAppController.sendMessage(cleanPhone, "👋 Hello! Welcome to Food Ordering!\n\nPlease tell me your name to get started:");
      }
      // If session exists but has no state, reset it
      else if (!session.state) {
        session.state = 'ask_name';
        await WhatsAppController.sendMessage(cleanPhone, "👋 Hello! Welcome to Food Ordering!\n\nPlease tell me your name to get started:");
      }
      
      // Handle message based on current state
      if (ButtonPayload) {
        await WhatsAppController.handleButtonReply(cleanPhone, ButtonPayload, session);
      } else if (Body) {
        await WhatsAppController.handleConversationFlow(cleanPhone, Body.trim(), session);
      }

      // Update session with cleanPhone
      userSessions.set(cleanPhone, session);

      res.status(200).send('OK');
    } catch (error) {
      console.error('❌ Webhook error:', error);
      res.status(500).send('Error');
    }
  }

  // Handle order management commands from restaurant owners
  static async handleOwnerOrderCommand(phone, message, owner) {
    try {
      // Check for ACCEPT, REJECT, READY, PAID, DELIVERED, or ORDERS commands
      const acceptMatch = message.match(/^ACCEPT\s+(\d+)$/i);
      const rejectMatch = message.match(/^REJECT\s+(\d+)$/i);
      const readyMatch = message.match(/^READY\s+(\d+)$/i);
      const paidMatch = message.match(/^PAID\s+(\d+)$/i);
      const deliveredMatch = message.match(/^DELIVERED\s+(\d+)$/i);
      const ordersMatch = message.match(/^ORDERS$/i);
      
      if (acceptMatch) {
        const orderId = parseInt(acceptMatch[1]);
        await WhatsAppController.handleOrderAcceptance(phone, orderId, owner);
        return true;
      }
      
      if (rejectMatch) {
        const orderId = parseInt(rejectMatch[1]);
        await WhatsAppController.handleOrderRejection(phone, orderId, owner);
        return true;
      }
      
      if (readyMatch) {
        const orderId = parseInt(readyMatch[1]);
        await WhatsAppController.handleOrderReady(phone, orderId, owner);
        return true;
      }
      
      if (paidMatch) {
        const orderId = parseInt(paidMatch[1]);
        await WhatsAppController.handleOrderPaid(phone, orderId, owner);
        return true;
      }
      
      if (deliveredMatch) {
        const orderId = parseInt(deliveredMatch[1]);
        await WhatsAppController.handleOrderDelivered(phone, orderId, owner);
        return true;
      }
      
      if (ordersMatch) {
        await WhatsAppController.handleOrdersList(phone, owner);
        return true;
      }
      
      // For restaurant owners, if it's not a command, send help message instead of starting food ordering
      if (owner.role === 'restaurant_owner') {
        await WhatsAppController.sendOwnerHelpMessage(phone);
        return true; // Prevent food ordering flow
      }
      
      return false; // Not an order command
    } catch (error) {
      console.error('❌ Error handling owner order command:', error);
      await WhatsAppController.sendMessage(phone, "❌ Sorry, there was an error processing your command. Please try again.");
      return true; // Still return true to prevent normal flow
    }
  }

  // Handle order acceptance by restaurant owner
  static async handleOrderAcceptance(phone, orderId, owner) {
    try {
      // Get the order details
      const order = await Order.findById(orderId);
      if (!order) {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} not found.`);
        return;
      }

      // Check if this owner is authorized to manage this order
      const restaurant = await Restaurant.findById(order.restaurant_id);
      if (!restaurant || restaurant.owner_id !== owner.id) {
        await WhatsAppController.sendMessage(phone, `❌ You are not authorized to manage Order #${orderId}.`);
        return;
      }

      // Check if order is still pending
      if (order.status !== 'pending') {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} has already been ${order.status}.`);
        return;
      }

      // Update order status to confirmed
      await Order.updateStatus(orderId, 'confirmed');

      // Create dashboard notification for customer
      try {
        const customer = await User.findById(order.user_id);
        if (customer && customer.id) {
          await Notification.create({
            type: 'order_confirmed',
            title: 'Order Confirmed',
            message: `Your order #${orderId} has been confirmed by ${restaurant.name}`,
            user_id: customer.id,
            order_id: orderId,
            status: 'pending'
          });
        }
      } catch (notifyErr) {
        console.error('Failed to create customer notification:', notifyErr);
      }

      // Send confirmation to restaurant owner
      let ownerConfirmMessage = `✅ ORDER ACCEPTED!\n\n`;
      ownerConfirmMessage += `📋 Order #${orderId} has been confirmed\n`;
      ownerConfirmMessage += `🏪 Restaurant: ${restaurant.name}\n`;
      ownerConfirmMessage += `💰 Total: ₹${order.total}\n\n`;
      ownerConfirmMessage += `📱 The customer will be notified about the confirmation.\n\n`;
      ownerConfirmMessage += `Next steps:\n`;
      ownerConfirmMessage += `• Start preparing the order\n`;
      ownerConfirmMessage += `• Reply 'READY ${orderId}' when order is ready for pickup/delivery`;
      
      await WhatsAppController.sendMessage(phone, ownerConfirmMessage);

      // Notify customer about order confirmation
      const customer = await User.findById(order.user_id);
      if (customer && customer.phone) {
        let customerMessage = `🎉 Great news! Your order has been confirmed!\n\n`;
        customerMessage += `📋 Order #${orderId}\n`;
        customerMessage += `🏪 ${restaurant.name}\n`;
        customerMessage += `💰 Total: ₹${order.total}\n\n`;
        customerMessage += `⏱️ Your order is being prepared.\n`;
        customerMessage += `We'll notify you when it's ready!`;
        
        await WhatsAppController.sendMessage(customer.phone, customerMessage);
      }

    } catch (error) {
      console.error('❌ Error handling order acceptance:', error);
      await WhatsAppController.sendMessage(phone, `❌ Sorry, there was an error accepting Order #${orderId}. Please try again.`);
    }
  }

  // Handle order rejection by restaurant owner
  static async handleOrderRejection(phone, orderId, owner) {
    try {
      // Get the order details
      const order = await Order.findById(orderId);
      if (!order) {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} not found.`);
        return;
      }

      // Check if this owner is authorized to manage this order
      const restaurant = await Restaurant.findById(order.restaurant_id);
      if (!restaurant || restaurant.owner_id !== owner.id) {
        await WhatsAppController.sendMessage(phone, `❌ You are not authorized to manage Order #${orderId}.`);
        return;
      }

      // Check if order is still pending
      if (order.status !== 'pending') {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} has already been ${order.status}.`);
        return;
      }

      // Update order status to rejected
      await Order.updateStatus(orderId, 'rejected');

      // Create dashboard notification for customer
      try {
        const customer = await User.findById(order.user_id);
        if (customer && customer.id) {
          await Notification.create({
            type: 'order_rejected',
            title: 'Order Rejected',
            message: `Your order #${orderId} has been rejected by ${restaurant.name}`,
            user_id: customer.id,
            order_id: orderId,
            status: 'pending'
          });
        }
      } catch (notifyErr) {
        console.error('Failed to create customer notification:', notifyErr);
      }

      // Send confirmation to restaurant owner
      let ownerRejectMessage = `❌ ORDER REJECTED\n\n`;
      ownerRejectMessage += `📋 Order #${orderId} has been rejected\n`;
      ownerRejectMessage += `🏪 Restaurant: ${restaurant.name}\n`;
      ownerRejectMessage += `💰 Total: ₹${order.total}\n\n`;
      ownerRejectMessage += `📱 The customer will be notified about the rejection.`;
      
      await WhatsAppController.sendMessage(phone, ownerRejectMessage);

      // Notify customer about order rejection
      const customer = await User.findById(order.user_id);
      if (customer && customer.phone) {
        let customerMessage = `😔 Sorry, your order has been rejected.\n\n`;
        customerMessage += `📋 Order #${orderId}\n`;
        customerMessage += `🏪 ${restaurant.name}\n`;
        customerMessage += `💰 Total: ₹${order.total}\n\n`;
        customerMessage += `Possible reasons:\n`;
        customerMessage += `• Restaurant is too busy\n`;
        customerMessage += `• Some items are unavailable\n`;
        customerMessage += `• Delivery area issue\n\n`;
        customerMessage += `Please try ordering again or contact the restaurant directly.`;
        
        await WhatsAppController.sendMessage(customer.phone, customerMessage);
      }

    } catch (error) {
      console.error('❌ Error handling order rejection:', error);
      await WhatsAppController.sendMessage(phone, `❌ Sorry, there was an error rejecting Order #${orderId}. Please try again.`);
    }
  }

  // Handle order ready notification by restaurant owner
  static async handleOrderReady(phone, orderId, owner) {
    try {
      // Get the order details
      const order = await Order.findById(orderId);
      if (!order) {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} not found.`);
        return;
      }

      // Check if this owner is authorized to manage this order
      const restaurant = await Restaurant.findById(order.restaurant_id);
      if (!restaurant || restaurant.owner_id !== owner.id) {
        await WhatsAppController.sendMessage(phone, `❌ You are not authorized to manage Order #${orderId}.`);
        return;
      }

      // Check if order is confirmed
      if (order.status !== 'confirmed') {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} must be confirmed before marking as ready. Current status: ${order.status}`);
        return;
      }

      // Update order status to ready
      await Order.updateStatus(orderId, 'ready');

      // Create dashboard notification for customer
      try {
        const customer = await User.findById(order.user_id);
        if (customer && customer.id) {
          await Notification.create({
            type: 'order_ready',
            title: 'Order Ready',
            message: `Your order #${orderId} is ready for pickup/delivery`,
            user_id: customer.id,
            order_id: orderId,
            status: 'pending'
          });
        }
      } catch (notifyErr) {
        console.error('Failed to create customer notification:', notifyErr);
      }

      // Send confirmation to restaurant owner
      let ownerReadyMessage = `🍽️ ORDER READY!\n\n`;
      ownerReadyMessage += `📋 Order #${orderId} is ready for pickup/delivery\n`;
      ownerReadyMessage += `🏪 Restaurant: ${restaurant.name}\n`;
      ownerReadyMessage += `💰 Total: ₹${order.total}\n\n`;
      ownerReadyMessage += `📱 The customer has been notified.\n\n`;
      ownerReadyMessage += `Next steps:\n`;
      ownerReadyMessage += `• Wait for customer pickup/delivery\n`;
      if (order.payment_method === 'COD') {
        ownerReadyMessage += `• Collect ₹${order.total} cash payment\n`;
        ownerReadyMessage += `• Reply 'DELIVERED ${orderId}' when delivered (COD - no PAID command needed)`;
      } else {
        ownerReadyMessage += `• Reply 'PAID ${orderId}' when payment is received\n`;
        ownerReadyMessage += `• Then reply 'DELIVERED ${orderId}' when delivered`;
      }
      
      await WhatsAppController.sendMessage(phone, ownerReadyMessage);

      // Notify customer about order ready
      const customer = await User.findById(order.user_id);
      if (customer && customer.phone) {
        let customerMessage = `🍽️ Your order is ready!\n\n`;
        customerMessage += `📋 Order #${orderId}\n`;
        customerMessage += `🏪 ${restaurant.name}\n`;
        customerMessage += `📍 ${restaurant.address}\n`;
        customerMessage += `💰 Total: ₹${order.total}\n\n`;
        
        if (order.payment_method === 'COD') {
          customerMessage += `💵 Payment: Cash on Delivery\n`;
          customerMessage += `Please have ₹${order.total} ready.\n\n`;
        } else {
          customerMessage += `💳 Payment: ${order.payment_method}\n\n`;
        }
        
        customerMessage += `📞 Restaurant Contact: ${restaurant.phone || 'Not available'}\n`;
        customerMessage += `⏰ Please collect your order soon!`;
        
        await WhatsAppController.sendMessage(customer.phone, customerMessage);
      }

    } catch (error) {
      console.error('❌ Error handling order ready:', error);
      await WhatsAppController.sendMessage(phone, `❌ Sorry, there was an error marking Order #${orderId} as ready. Please try again.`);
    }
  }

  // Handle order payment confirmation by restaurant owner
  static async handleOrderPaid(phone, orderId, owner) {
    try {
      // Get the order details
      const order = await Order.findById(orderId);
      if (!order) {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} not found.`);
        return;
      }

      // Check if this owner is authorized to manage this order
      const restaurant = await Restaurant.findById(order.restaurant_id);
      if (!restaurant || restaurant.owner_id !== owner.id) {
        await WhatsAppController.sendMessage(phone, `❌ You are not authorized to manage Order #${orderId}.`);
        return;
      }

      // Check if order is ready
      if (order.status !== 'ready') {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} must be ready before marking as paid. Current status: ${order.status}`);
        return;
      }

      // Check if payment is already confirmed
      if (order.payment_status === 'paid') {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} is already marked as paid.`);
        return;
      }

      // Update payment status to paid
      await Order.updatePaymentStatus(orderId, 'paid');

      // Create dashboard notification for customer
      try {
        const customer = await User.findById(order.user_id);
        if (customer && customer.id) {
          await Notification.create({
            type: 'payment_confirmed',
            title: 'Payment Confirmed',
            message: `Payment for order #${orderId} has been confirmed`,
            user_id: customer.id,
            order_id: orderId,
            status: 'pending'
          });
        }
      } catch (notifyErr) {
        console.error('Failed to create customer notification:', notifyErr);
      }

      // Send confirmation to restaurant owner
      let ownerPaidMessage = `💳 PAYMENT CONFIRMED!\n\n`;
      ownerPaidMessage += `📋 Order #${orderId} - Payment received\n`;
      ownerPaidMessage += `🏪 Restaurant: ${restaurant.name}\n`;
      ownerPaidMessage += `💰 Total: ₹${order.total}\n`;
      ownerPaidMessage += `💵 Payment Method: ${order.payment_method}\n\n`;
      ownerPaidMessage += `📱 The customer has been notified.\n\n`;
      ownerPaidMessage += `✅ Order is now ready for delivery!\n`;
      ownerPaidMessage += `Reply 'DELIVERED ${orderId}' when order is delivered`;
      
      await WhatsAppController.sendMessage(phone, ownerPaidMessage);

      // Notify customer about payment confirmation
      const customer = await User.findById(order.user_id);
      if (customer && customer.phone) {
        let customerMessage = `💳 Payment confirmed!\n\n`;
        customerMessage += `📋 Order #${orderId}\n`;
        customerMessage += `🏪 ${restaurant.name}\n`;
        customerMessage += `💰 Total: ₹${order.total}\n`;
        customerMessage += `💵 Payment Method: ${order.payment_method}\n\n`;
        customerMessage += `✅ Your payment has been received and confirmed.\n`;
        customerMessage += `Your order will be delivered shortly!`;
        
        await WhatsAppController.sendMessage(customer.phone, customerMessage);
      }

    } catch (error) {
      console.error('❌ Error handling order payment:', error);
      await WhatsAppController.sendMessage(phone, `❌ Sorry, there was an error marking Order #${orderId} as paid. Please try again.`);
    }
  }

  // Handle order delivered notification by restaurant owner
  static async handleOrderDelivered(phone, orderId, owner) {
    try {
      // Get the order details
      const order = await Order.findById(orderId);
      if (!order) {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} not found.`);
        return;
      }

      // Check if this owner is authorized to manage this order
      const restaurant = await Restaurant.findById(order.restaurant_id);
      if (!restaurant || restaurant.owner_id !== owner.id) {
        await WhatsAppController.sendMessage(phone, `❌ You are not authorized to manage Order #${orderId}.`);
        return;
      }

      // Check if order is ready and paid
      if (order.status !== 'ready') {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} must be ready before marking as delivered. Current status: ${order.status}`);
        return;
      }

      // Check if payment is confirmed (for non-COD orders) or auto-confirm for COD
      if (order.payment_method === 'COD') {
        // For COD orders, automatically mark as paid when delivered
        if (order.payment_status !== 'paid') {
          await Order.updatePaymentStatus(orderId, 'paid');
        }
      } else if (order.payment_status !== 'paid') {
        await WhatsAppController.sendMessage(phone, `❌ Order #${orderId} payment must be confirmed before delivery. Reply 'PAID ${orderId}' to confirm payment first.`);
        return;
      }

      // Update order status to delivered
      await Order.updateStatus(orderId, 'delivered');

      // Create dashboard notification for customer
      try {
        const customer = await User.findById(order.user_id);
        if (customer && customer.id) {
          await Notification.create({
            type: 'order_delivered',
            title: 'Order Delivered',
            message: `Your order #${orderId} has been delivered successfully`,
            user_id: customer.id,
            order_id: orderId,
            status: 'pending'
          });
        }
      } catch (notifyErr) {
        console.error('Failed to create customer notification:', notifyErr);
      }

      // Send confirmation to restaurant owner
      let ownerDeliveredMessage = `✅ ORDER DELIVERED!\n\n`;
      ownerDeliveredMessage += `📋 Order #${orderId} has been successfully delivered\n`;
      ownerDeliveredMessage += `🏪 Restaurant: ${restaurant.name}\n`;
      ownerDeliveredMessage += `💰 Total: ₹${order.total}\n\n`;
      ownerDeliveredMessage += `📱 The customer has been notified.\n`;
      ownerDeliveredMessage += `🎉 Thank you for completing this order!`;
      
      await WhatsAppController.sendMessage(phone, ownerDeliveredMessage);

      // Notify customer about order delivery
      const customer = await User.findById(order.user_id);
      if (customer && customer.phone) {
        let customerMessage = `🎉 Order delivered successfully!\n\n`;
        customerMessage += `📋 Order #${orderId}\n`;
        customerMessage += `🏪 ${restaurant.name}\n`;
        customerMessage += `💰 Total: ₹${order.total}\n\n`;
        customerMessage += `Thank you for ordering with us! 🙏\n`;
        customerMessage += `We hope you enjoyed your meal.\n\n`;
        customerMessage += `Please rate your experience and order again soon!`;
        
        await WhatsAppController.sendMessage(customer.phone, customerMessage);
      }

    } catch (error) {
      console.error('❌ Error handling order delivered:', error);
      await WhatsAppController.sendMessage(phone, `❌ Sorry, there was an error marking Order #${orderId} as delivered. Please try again.`);
    }
  }

  // Handle orders list request by restaurant owner
  static async handleOrdersList(phone, owner) {
    try {
      // Find the restaurant owned by this user
      const restaurants = await Restaurant.findByOwnerId(owner.id);
      if (!restaurants || restaurants.length === 0) {
        await WhatsAppController.sendMessage(phone, `❌ No restaurant found for your account.`);
        return;
      }

      // Get the first restaurant (assuming one restaurant per owner)
      const restaurant = restaurants[0];

      // Get pending orders for this restaurant
      const pendingOrders = await Order.findByRestaurantAndStatus(restaurant.id, ['pending', 'confirmed', 'ready']);
      
      if (!pendingOrders || pendingOrders.length === 0) {
        let noOrdersMessage = `📋 No pending orders\n\n`;
        noOrdersMessage += `🏪 ${restaurant.name}\n`;
        noOrdersMessage += `✅ All caught up! No orders waiting for action.\n\n`;
        noOrdersMessage += `Available commands:\n`;
        noOrdersMessage += `• ORDERS - Check pending orders\n`;
        noOrdersMessage += `• ACCEPT [id] - Accept order\n`;
        noOrdersMessage += `• REJECT [id] - Reject order\n`;
        noOrdersMessage += `• READY [id] - Mark as ready\n`;
        noOrdersMessage += `• PAID [id] - Confirm payment\n`;
        noOrdersMessage += `• DELIVERED [id] - Mark as delivered`;
        
        await WhatsAppController.sendMessage(phone, noOrdersMessage);
        return;
      }

      let ordersMessage = `📋 PENDING ORDERS (${pendingOrders.length})\n\n`;
      ordersMessage += `🏪 ${restaurant.name}\n\n`;

      pendingOrders.forEach((order, index) => {
        ordersMessage += `${index + 1}. Order #${order.id}\n`;
        ordersMessage += `   👤 ${order.customer_name || 'Customer'}\n`;
        ordersMessage += `   📞 ${order.customer_phone || 'N/A'}\n`;
        ordersMessage += `   💰 ₹${order.total}\n`;
        ordersMessage += `   📱 Status: ${order.status}\n`;
        ordersMessage += `   💳 Payment: ${order.payment_status} (${order.payment_method})\n`;
        ordersMessage += `   ⏰ ${new Date(order.created_at).toLocaleString()}\n\n`;
      });

      ordersMessage += `Commands:\n`;
      ordersMessage += `• ACCEPT [id] - Accept pending order\n`;
      ordersMessage += `• REJECT [id] - Reject pending order\n`;
      ordersMessage += `• READY [id] - Mark confirmed order as ready\n`;
      ordersMessage += `• PAID [id] - Confirm payment received\n`;
      ordersMessage += `• DELIVERED [id] - Mark ready+paid order as delivered`;

      await WhatsAppController.sendMessage(phone, ordersMessage);

    } catch (error) {
      console.error('❌ Error handling orders list:', error);
      await WhatsAppController.sendMessage(phone, `❌ Sorry, there was an error retrieving orders. Please try again.`);
    }
  }

  // Send help message to restaurant owner
  static async sendOwnerHelpMessage(phone) {
    try {
      let helpMessage = `🏪 RESTAURANT OWNER COMMANDS\n\n`;
      helpMessage += `📋 Order Management:\n`;
      helpMessage += `• ORDERS - View pending orders\n`;
      helpMessage += `• ACCEPT [order_id] - Accept order\n`;
      helpMessage += `• REJECT [order_id] - Reject order\n`;
      helpMessage += `• READY [order_id] - Mark as ready\n`;
      helpMessage += `• PAID [order_id] - Confirm payment\n`;
      helpMessage += `• DELIVERED [order_id] - Mark as delivered\n\n`;
      helpMessage += `📊 Order Flow:\n`;
      helpMessage += `pending → ACCEPT → confirmed → READY → ready → PAID → DELIVERED → delivered\n\n`;
      helpMessage += `💡 Examples:\n`;
      helpMessage += `• Type "ORDERS" to see all pending orders\n`;
      helpMessage += `• Type "ACCEPT 123" to accept order #123\n`;
      helpMessage += `• Type "READY 123" to mark order #123 as ready\n\n`;
      helpMessage += `❓ Need help? Contact support.`;

      await WhatsAppController.sendMessage(phone, helpMessage);
    } catch (error) {
      console.error('❌ Error sending owner help message:', error);
    }
  }

  // Handle conversation flow based on current state
  static async handleConversationFlow(phone, message, session) {
    try {
      switch (session.state) {
        case 'ask_name':
          await WhatsAppController.handleNameInput(phone, message, session);
          break;
        
        case 'ask_location':
          await WhatsAppController.handleLocationInput(phone, message, session);
          break;

        case 'welcome':
          await WhatsAppController.handleWelcome(phone, session);
          break;
        
        case 'restaurant_selection':
          await WhatsAppController.handleRestaurantSelection(phone, message, session);
          break;
        
        case 'menu_browsing':
          await WhatsAppController.handleMenuBrowsing(phone, message, session);
          break;
        
        case 'category_selection':
          await WhatsAppController.handleCategorySelection(phone, message, session);
          break;
        
        case 'item_selection':
          await WhatsAppController.handleItemSelection(phone, message, session);
          break;
        
        case 'cart_management':
          await WhatsAppController.handleCartManagement(phone, message, session);
          break;
        
        case 'delete_item_selection':
          await WhatsAppController.handleDeleteItemSelection(phone, message, session);
          break;
        
        case 'payment_selection':
          await WhatsAppController.handlePaymentSelection(phone, message, session);
          break;
        
        default:
          await WhatsAppController.handleWelcome(phone, session);
      }
    } catch (error) {
      console.error('❌ Conversation flow error:', error);
      await WhatsAppController.sendMessage(phone, '❌ Sorry, something went wrong. Please try again.');
    }
  }

  // Welcome message with restaurant options
  static async handleWelcome(phone, session) {
    try {
      const restaurants = await Restaurant.getAll();
      
      if (restaurants.length === 0) {
        await WhatsAppController.sendMessage(phone, '😔 Sorry, no restaurants are available at the moment. Please try again later.');
        return;
      }
      
      let welcomeMessage = "🍽️ Welcome to Food Ordering! 🛍️\n\n";
      welcomeMessage += "Available Restaurants:\n\n";
      
      restaurants.forEach((restaurant, index) => {
        welcomeMessage += `${index + 1}. 🏪 ${restaurant.name}\n`;
        welcomeMessage += `   📍 ${restaurant.address || 'Address not available'}\n`;
        welcomeMessage += `   📞 ${restaurant.phone || 'Phone not available'}\n\n`;
      });
      
      welcomeMessage += "Reply with restaurant number (1, 2, 3...) to start ordering! 🛒";
      
      await WhatsAppController.sendMessage(phone, welcomeMessage);
      session.state = 'restaurant_selection';
      session.restaurants = restaurants;
      session.cart = [];
    } catch (error) {
      console.error('❌ Error in handleWelcome:', error);
      await WhatsAppController.sendMessage(phone, "Sorry, there was an error. Please try again.");
    }
  }

  // Handle restaurant selection
  static async handleRestaurantSelection(phone, message, session) {
    const restaurantIndex = parseInt(message) - 1;
    
    if (restaurantIndex >= 0 && restaurantIndex < session.restaurants.length) {
      session.selectedRestaurant = session.restaurants[restaurantIndex];
      
      let confirmMessage = `✅ Great choice! You selected:\n\n`;
      confirmMessage += `🏪 ${session.selectedRestaurant.name}\n`;
      confirmMessage += `📍 ${session.selectedRestaurant.address}\n\n`;
      confirmMessage += `What would you like to do?\n\n`;
      confirmMessage += `1. 📋 View Menu\n`;
      confirmMessage += `2. 🛒 View Cart (${session.cart.length} items)\n`;
      confirmMessage += `3. 🏪 Change Restaurant\n\n`;
      confirmMessage += `Reply with option number:`;
      
      await WhatsAppController.sendMessage(phone, confirmMessage);
      session.state = 'menu_browsing';
    } else {
      await WhatsAppController.sendMessage(phone, "❌ Invalid restaurant number. Please choose a valid option (1, 2, 3...)");
    }
  }

  // Handle menu browsing options
  static async handleMenuBrowsing(phone, message, session) {
    switch (message) {
      case '1':
        await WhatsAppController.showMenuCategories(phone, session);
        break;
      case '2':
        await WhatsAppController.showCart(phone, session);
        break;
      case '3':
        await WhatsAppController.handleWelcome(phone, session);
        break;
      default:
        await WhatsAppController.sendMessage(phone, "❌ Please reply with 1, 2, or 3");
    }
  }

  // Show menu categories for selected restaurant
  static async showMenuCategories(phone, session) {
    try {
      console.log(`🔍 Fetching menu for restaurant ID: ${session.selectedRestaurant.id}`);
      
      if (!session.selectedRestaurant || !session.selectedRestaurant.id) {
        throw new Error('No restaurant selected or invalid restaurant ID');
      }
      
      const menuItems = await MenuItem.findByRestaurant(session.selectedRestaurant.id);
      console.log(`📋 Found ${menuItems ? menuItems.length : 0} menu items`);
      
      if (!menuItems || menuItems.length === 0) {
        await WhatsAppController.sendMessage(phone, "😔 Sorry, this restaurant doesn't have any menu items available right now.");
        return;
      }
      
      // Group items by category
      const categories = [...new Set(menuItems.map(item => item.category))];
      console.log(`🏷️ Found ${categories.length} categories:`, categories);
      
      let categoryMessage = `📋 ${session.selectedRestaurant.name} Menu Categories:\n\n`;
      
      categories.forEach((category, index) => {
        categoryMessage += `${index + 1}. ${WhatsAppController.getCategoryIcon(category)} ${category}\n`;
      });
      
      categoryMessage += `\n0. ⬅️ Back to Restaurant Options\n\n`;
      categoryMessage += `Reply with category number:`;
      
      await WhatsAppController.sendMessage(phone, categoryMessage);
      session.state = 'category_selection';
      session.categories = categories;
      session.menuItems = menuItems;
      
      console.log(`✅ Menu categories sent successfully to ${phone}`);
    } catch (error) {
      console.error('❌ Error showing menu categories:', error);
      console.error('Session state:', {
        restaurantId: session?.selectedRestaurant?.id,
        state: session?.state,
        phone
      });
      await WhatsAppController.sendMessage(phone, "Sorry, there was an error loading the menu. Please try selecting the restaurant again.");
      // Reset session state to welcome
      session.state = 'welcome';
      await WhatsAppController.handleWelcome(phone, session);
    }
  }

  // Handle category selection
  static async handleCategorySelection(phone, message, session) {
    if (message === '0') {
      session.state = 'menu_browsing';
      await WhatsAppController.handleMenuBrowsing(phone, '1', session);
      return;
    }
    
    const categoryIndex = parseInt(message) - 1;
    
    if (categoryIndex >= 0 && categoryIndex < session.categories.length) {
      const selectedCategory = session.categories[categoryIndex];
      const categoryItems = session.menuItems.filter(item => item.category === selectedCategory);
      
      let itemsMessage = `${WhatsAppController.getCategoryIcon(selectedCategory)} ${selectedCategory} Menu:\n\n`;
      
      categoryItems.forEach((item, index) => {
        itemsMessage += `${index + 1}. ${item.name}\n`;
        itemsMessage += `   💰 ₹${item.price}\n`;
        if (item.description) {
          itemsMessage += `   📝 ${item.description.substring(0, 50)}...\n`;
        }
        itemsMessage += `\n`;
      });
      
      itemsMessage += `0. ⬅️ Back to Categories\n\n`;
      itemsMessage += `Reply with item number to add to cart:`;
      
      await WhatsAppController.sendMessage(phone, itemsMessage);
      session.state = 'item_selection';
      session.currentCategoryItems = categoryItems;
    } else {
      await WhatsAppController.sendMessage(phone, "❌ Invalid category number. Please choose a valid option.");
    }
  }

  // Handle item selection and add to cart
  static async handleItemSelection(phone, message, session) {
    if (message === '0') {
      session.state = 'category_selection';
      await WhatsAppController.showMenuCategories(phone, session);
      return;
    }
    
    const itemIndex = parseInt(message) - 1;
    
    if (itemIndex >= 0 && itemIndex < session.currentCategoryItems.length) {
      const selectedItem = session.currentCategoryItems[itemIndex];
      
      // Add to cart
      const existingCartItem = session.cart.find(item => item.id === selectedItem.id);
      if (existingCartItem) {
        existingCartItem.quantity += 1;
      } else {
        session.cart.push({
          ...selectedItem,
          quantity: 1
        });
      }
      
      let addedMessage = `✅ Added to cart!\n\n`;
      addedMessage += `🍽️ ${selectedItem.name}\n`;
      addedMessage += `💰 ₹${selectedItem.price}\n\n`;
      addedMessage += `🛒 Current Cart: ${session.cart.length} items\n`;
      addedMessage += `💵 Total: ₹${WhatsAppController.calculateCartTotal(session.cart)}\n\n`;
      addedMessage += `What's next?\n`;
      addedMessage += `1. ➕ Add more items\n`;
      addedMessage += `2. 🛒 View Cart\n`;
      addedMessage += `3. 🗑️ Delete Item\n`;
      addedMessage += `4. ✅ Checkout\n\n`;
      addedMessage += `Reply with option number:`;
      
      await WhatsAppController.sendMessage(phone, addedMessage);
      session.state = 'cart_management';
      session.lastView = 'item_added'; // Clear cart view flag
    } else {
      await WhatsAppController.sendMessage(phone, "❌ Invalid item number. Please choose a valid option.");
    }
  }

  // Handle cart management
  static async handleCartManagement(phone, message, session) {
    switch (message) {
      case '1':
        await WhatsAppController.showMenuCategories(phone, session);
        break;
      case '2':
        // Check if we're coming from main flow or cart view
        if (session.cart.length === 0) {
          await WhatsAppController.sendMessage(phone, "🛒 Your cart is empty! Reply with '1' to browse menu.");
        } else {
          await WhatsAppController.initiateCheckout(phone, session);
        }
        break;
      case '3':
        await WhatsAppController.showCartForDeletion(phone, session);
        break;
      case '4':
        // This could be checkout (from main flow) or clear cart (from cart view)
        if (session.lastView === 'cart_view') {
          // Clear cart
          session.cart = [];
          await WhatsAppController.sendMessage(phone, "🗑️ Cart cleared! Reply with '1' to browse menu and add items.");
          session.state = 'menu_browsing';
        } else {
          await WhatsAppController.initiateCheckout(phone, session);
        }
        break;
      default:
        await WhatsAppController.sendMessage(phone, "❌ Please reply with 1, 2, 3, or 4");
    }
  }

  // Show cart contents
  static async showCart(phone, session) {
    if (session.cart.length === 0) {
      await WhatsAppController.sendMessage(phone, "🛒 Your cart is empty! Reply with '1' to browse menu.");
      return;
    }
    
    let cartMessage = `🛒 Your Cart:\n\n`;
    
    session.cart.forEach((item, index) => {
      cartMessage += `${index + 1}. ${item.name}\n`;
      cartMessage += `   💰 ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}\n\n`;
    });
    
    cartMessage += `💵 Total: ₹${WhatsAppController.calculateCartTotal(session.cart)}\n\n`;
    cartMessage += `Options:\n`;
    cartMessage += `1. ➕ Add more items\n`;
    cartMessage += `2. ✅ Checkout\n`;
    cartMessage += `3. 🗑️ Delete item\n`;
    cartMessage += `4. 🗑️ Clear cart\n\n`;
    cartMessage += `Reply with option number:`;
    
    await WhatsAppController.sendMessage(phone, cartMessage);
    session.state = 'cart_management';
    session.lastView = 'cart_view'; // Flag to indicate we're coming from cart view
  }

  // Show cart items for deletion with numbers
  static async showCartForDeletion(phone, session) {
    if (session.cart.length === 0) {
      await WhatsAppController.sendMessage(phone, "🛒 Your cart is empty! Reply with '1' to browse menu.");
      return;
    }
    
    let deleteMessage = `🗑️ Delete Item from Cart:\n\n`;
    
    session.cart.forEach((item, index) => {
      deleteMessage += `${index + 1}. ${item.name}\n`;
      deleteMessage += `   💰 ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}\n\n`;
    });
    
    deleteMessage += `Reply with the item number to delete (1, 2, 3...):\n`;
    deleteMessage += `Or reply '0' to go back to cart options.`;
    
    await WhatsAppController.sendMessage(phone, deleteMessage);
    session.state = 'delete_item_selection';
  }

  // Handle deletion of specific item
  static async handleDeleteItemSelection(phone, message, session) {
    if (message === '0') {
      await WhatsAppController.showCart(phone, session);
      return;
    }
    
    const itemIndex = parseInt(message) - 1;
    
    if (itemIndex >= 0 && itemIndex < session.cart.length) {
      const deletedItem = session.cart[itemIndex];
      
      // Remove item from cart
      session.cart.splice(itemIndex, 1);
      
      let deleteConfirmMessage = `🗑️ Item removed from cart!\n\n`;
      deleteConfirmMessage += `❌ ${deletedItem.name} (₹${deletedItem.price} x ${deletedItem.quantity})\n\n`;
      
      if (session.cart.length > 0) {
        deleteConfirmMessage += `🛒 Remaining items: ${session.cart.length}\n`;
        deleteConfirmMessage += `💵 New total: ₹${WhatsAppController.calculateCartTotal(session.cart)}\n\n`;
        deleteConfirmMessage += `What would you like to do?\n`;
        deleteConfirmMessage += `1. ➕ Add more items\n`;
        deleteConfirmMessage += `2. 🛒 View Cart\n`;
        deleteConfirmMessage += `3. 🗑️ Delete another item\n`;
        deleteConfirmMessage += `4. ✅ Checkout\n\n`;
        deleteConfirmMessage += `Reply with option number:`;
        
        session.state = 'cart_management';
      } else {
        deleteConfirmMessage += `🛒 Your cart is now empty!\n\n`;
        deleteConfirmMessage += `Reply with '1' to browse menu and add items.`;
        session.state = 'menu_browsing';
      }
      
      await WhatsAppController.sendMessage(phone, deleteConfirmMessage);
    } else {
      await WhatsAppController.sendMessage(phone, "❌ Invalid item number. Please choose a valid option from the list above.");
    }
  }

  // Initiate checkout process
  static async initiateCheckout(phone, session) {
    if (session.cart.length === 0) {
      await WhatsAppController.sendMessage(phone, "🛒 Your cart is empty! Add some items first.");
      return;
    }
    
    let checkoutMessage = `🧾 Order Summary:\n\n`;
    checkoutMessage += `🏪 Restaurant: ${session.selectedRestaurant.name}\n`;
    checkoutMessage += `📍 Address: ${session.selectedRestaurant.address}\n\n`;
    checkoutMessage += `🛒 Your Items:\n`;
    
    session.cart.forEach(item => {
      checkoutMessage += `• ${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`;
    });
    
    const total = WhatsAppController.calculateCartTotal(session.cart);
    session.total = total;
    
    checkoutMessage += `\n💰 Total Amount: ₹${total}\n\n`;
    checkoutMessage += 'Please choose payment method:\n\n';
    checkoutMessage += '1. 💵 Cash on Delivery (COD)\n';
    checkoutMessage += '2. 📱 UPI Payment\n\n';
    checkoutMessage += 'Reply with option number (1 or 2):';
    
    await WhatsAppController.sendMessage(phone, checkoutMessage);
    session.state = 'payment_selection';
  }

  // Handle checkout with delivery details
  static async handleCheckout(phone, message, session) {
    try {
      if (!session.cart || session.cart.length === 0) {
        await WhatsAppController.sendMessage(phone, "❌ Your cart is empty! Please add items before checkout.");
        session.state = 'menu_browsing';
        return;
      }

      const total = WhatsAppController.calculateCartTotal(session.cart);
      
      let summaryMessage = '🛍️ Order Summary:\n\n';
      session.cart.forEach((item, index) => {
        summaryMessage += `${index + 1}. ${item.name} x${item.quantity} = ₹${item.price * item.quantity}\n`;
      });

      summaryMessage += `\n💰 Total Amount: ₹${total}\n\n`;
      summaryMessage += 'Please choose payment method:\n\n';
      summaryMessage += '1. 💵 Cash on Delivery (COD)\n';
      summaryMessage += '2. 📱 UPI Payment\n\n';
      summaryMessage += 'Reply with option number (1 or 2):';

      session.total = total;
      session.state = 'payment_selection';
      
      await WhatsAppController.sendMessage(phone, summaryMessage);

    } catch (error) {
      console.error('❌ Error processing checkout:', error);
      await WhatsAppController.sendMessage(phone, "❌ Sorry, there was an error processing your order. Please try again.");
    }
  }

  static async handlePaymentSelection(phone, message, session) {
    console.log('Payment Selection - Current Session State:', session);

    if (!session.name || !session.location) {
      await WhatsAppController.sendMessage(phone, "❌ Missing user details. Please start over.");
      session.state = 'ask_name';
      return;
    }

    try {
      let paymentMethod;
      let paymentStatus;
      let confirmationMessage;

      switch (message) {
        case '1': // COD
          paymentMethod = 'COD';
          paymentStatus = 'pending';
          confirmationMessage = '✅ Order placed successfully!\n\n';
          confirmationMessage += `💰 Total Amount: ₹${session.total}\n`;
          confirmationMessage += '💵 Payment Method: Cash on Delivery\n\n';
          confirmationMessage += `🏠 Delivery Address: ${session.location}\n\n`;
          confirmationMessage += 'Thank you for ordering with us. 🙏\n';
          confirmationMessage += 'Your order will be delivered soon.';
          break;

        case '2': // UPI
          paymentMethod = 'UPI';
          paymentStatus = 'pending'; // Using 'pending' to match the database enum
          confirmationMessage = '✅ Order placed successfully!\n\n';
          confirmationMessage += `💰 Total Amount: ₹${session.total}\n`;
          confirmationMessage += '📱 Payment Method: UPI\n\n';
          confirmationMessage += 'Please pay using this UPI ID:\n';
          confirmationMessage += '7032107890-2@ibl 📱\n\n';
          confirmationMessage += `🏠 Delivery Address: ${session.location}\n\n`;
          confirmationMessage += 'Once payment is confirmed, your order will be processed.';
          break;

        default:
          await WhatsAppController.sendMessage(phone, '❌ Invalid option. Please reply with 1 for COD or 2 for UPI payment.');
          return;
      }

      // Create or get user
      let user = await User.findByPhone(phone);
      if (!user) {
        const userId = await User.create({
          name: session.name,
          phone: phone,
          password: null,  // Explicitly set password to null for WhatsApp users
          role: 'customer'
        });
        user = await User.findById(userId);
      }


      // Create order
      const orderId = await Order.create({
        user_id: user.id,
        restaurant_id: session.selectedRestaurant.id,
        total: session.total,
        delivery_address: session.location,
        status: 'pending',
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        notes: `Order placed via WhatsApp by ${session.name} (${phone})`
      });

      // Create dashboard notification for restaurant owner
      try {
        const owner = await User.findById(session.selectedRestaurant.owner_id);
        if (owner && owner.id) {
          await Notification.create({
            type: 'order_placed',
            title: 'New Order Placed',
            message: `Order #${orderId} has been placed by ${session.name} (₹${session.total})`,
            user_id: owner.id,
            order_id: orderId,
            status: 'pending'
          });
        }
      } catch (notifyErr) {
        console.error('Failed to create dashboard notification:', notifyErr);
      }

      // Create order items
      for (const cartItem of session.cart) {
        await Order.addItem(orderId, cartItem.id, cartItem.quantity, cartItem.price);
      }

      await WhatsAppController.sendMessage(phone, confirmationMessage);
      
      // Notify restaurant owner
      await WhatsAppController.notifyRestaurantOwner(session.selectedRestaurant, orderId, session.cart, {
        name: session.name,
        phone: phone
      });
      
      // Reset session
      session.cart = [];
      session.state = 'welcome';

    } catch (error) {
      console.error('Error in handlePaymentSelection:', error);
      await WhatsAppController.sendMessage(phone, "❌ Sorry, there was an error processing your payment. Please try again.");
      session.state = 'payment_selection'; // Keep user in payment selection state to retry
      throw error; // Propagate error up
    }
  }

  // Notify restaurant owner about new order
  static async notifyRestaurantOwner(restaurant, orderId, cartItems, customer) {
    try {
      const owner = await User.findById(restaurant.owner_id);
      if (owner && owner.phone) {
        let ownerMessage = `🚨 NEW ORDER ALERT! 🚨\n\n`;
        ownerMessage += `📋 Order #${orderId}\n`;
        ownerMessage += `🏪 ${restaurant.name}\n`;
        ownerMessage += `👤 Customer: ${customer.name}\n`;
        ownerMessage += `📞 Phone: ${customer.phone}\n\n`;
        ownerMessage += `🛒 Items:\n`;
        
        cartItems.forEach(item => {
          ownerMessage += `• ${item.name} x${item.quantity}\n`;
        });
        
        ownerMessage += `\n💵 Total: ₹${WhatsAppController.calculateCartTotal(cartItems)}\n\n`;
        ownerMessage += `⏰ Order Management Commands:\n`;
        ownerMessage += `• Reply 'ACCEPT ${orderId}' to accept\n`;
        ownerMessage += `• Reply 'REJECT ${orderId}' to reject\n`;
        ownerMessage += `• Reply 'ORDERS' to see all pending orders\n\n`;
        ownerMessage += `💡 After accepting: READY → PAID → DELIVERED`;
        
        await WhatsAppController.sendMessage(owner.phone, ownerMessage);
      }
    } catch (error) {
      console.error('❌ Error notifying restaurant owner:', error);
    }
  }

  // Handle button interactions
  static async handleButtonReply(phone, buttonPayload, session) {
    try {
      // Handle existing button functionality if needed
      console.log(`Button pressed: ${buttonPayload}`);
    } catch (error) {
      console.error('❌ Button reply error:', error);
      await WhatsAppController.sendMessage(phone, '❌ Sorry, something went wrong. Please try again.');
    }
  }

  // Start ordering flow (called from API)
  static async startOrderingFlow(phone) {
    try {
      // Validate phone number
      if (!phone) {
        throw new Error('Phone number is required');
      }
      
      // Clean phone number - remove any non-digit characters
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Ensure it's a valid 10-digit Indian phone number
      if (cleanPhone.length !== 10) {
        throw new Error("The 'To' number " + phone + " is not a valid 10-digit Indian phone number.");
      }
      
      console.log(`Starting WhatsApp ordering flow for: ${cleanPhone}`);
      
      // Clear any existing session
      userSessions.delete(cleanPhone);
      
      // Create new session
      const session = {
        state: 'ask_name',
        cart: [],
        selectedRestaurant: null,
        currentCategoryItems: null,
        categories: [],
        menuItems: [],
        userDetails: {}
      };
      
      // Send welcome message and ask for name
      await WhatsAppController.sendMessage(cleanPhone, "👋 Hello! Welcome to Food Ordering!\n\nPlease tell me your name to get started:");
      userSessions.set(cleanPhone, session);
      
      return { success: true, message: 'WhatsApp ordering flow started' };
    } catch (error) {
      console.error('❌ Error starting ordering flow:', error);
      return { success: false, error: error.message };
    }
  }

  // Send WhatsApp message
  static async sendMessage(to, messageText) {
    try {
      // Validate inputs
      if (!to || !messageText) {
        throw new Error('Phone number and message are required');
      }
      
      // Clean phone number - remove any non-digit characters
      const cleanPhone = to.replace(/\D/g, '');
      
      // Ensure it's a valid 10-digit Indian phone number
      // Twilio requires the country code for WhatsApp messages, but our database only stores 10 digits
      const twilioFormatPhone = '91' + cleanPhone;
      
      // Log the phone number being used
      console.log(`${cleanPhone}`);

      // Look up user ID for real-time notifications
      const user = await User.findByPhone(cleanPhone);
      
      // Create a message record first
      const message = await Message.create({
        phone: cleanPhone, // Store without country code
        message: messageText,
        type: 'outgoing'
      });

      // Send real-time notification if user found
      if (user && user.id) {
        const notificationServer = require('../utils/notificationServer');
        notificationServer.sendToUser(user.id, {
          type: 'whatsapp_message',
          message: messageText,
          timestamp: new Date().toISOString(),
          messageId: message.id
        });
      }

      if (!client) {
        console.log(`📱 [SIMULATION] WhatsApp message to ${cleanPhone}:`, messageText);
        // Return a simulated response with the actual message content
        return { 
          sid: `sim_${Date.now()}`,
          body: messageText,
          to: cleanPhone,
          status: 'delivered'
        };
      }

      const response = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:+${twilioFormatPhone}`, // Need country code for Twilio
        body: messageText
      });

      console.log(`✅ WhatsApp message sent to ${cleanPhone}`);
      return response;
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // Utility functions
  static calculateCartTotal(cart) {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  static getCategoryIcon(category) {
    const icons = {
      'Biryanis': '🍛',
      'Starters': '🔥',
      'Main Course': '🍽️',
      'Beverages': '🥤',
      'Cool Drinks': '🥤',
      'Desserts': '🍮',
      'Pizza': '🍕',
      'Burgers': '🍔',
      'Hot Starters': '🔥',
      'Veg Starters': '🥗',
      'Breads': '🍞'
    };
    return icons[category] || '🍴';
  }
}

module.exports = WhatsAppController;
