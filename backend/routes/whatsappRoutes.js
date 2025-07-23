const express = require('express');
const WhatsAppController = require('../controllers/whatsappController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

const router = express.Router();

// Webhook endpoint for Twilio WhatsApp
router.post('/webhook', WhatsAppController.webhook);

// Start ordering flow for customers
router.post('/start-order', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }
    
    const result = await WhatsAppController.startOrderingFlow(phone);
    res.json(result);
  } catch (error) {
    console.error('Error starting WhatsApp order:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send message endpoint (for testing)
router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    await WhatsAppController.sendMessage(to, message);
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send custom message (for restaurant owners and admins)
router.post('/send-message', 
  auth, 
  roleCheck(['restaurant_owner', 'super_admin']), 
  async (req, res) => {
    try {
      const { to, message } = req.body;
      await WhatsAppController.sendMessage(to, message);
      res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
      console.error('Error sending custom message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router;
