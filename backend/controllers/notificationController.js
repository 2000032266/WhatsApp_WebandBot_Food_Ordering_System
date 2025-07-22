const Notification = require('../models/Notification');

const notificationController = {
  // Get notifications for the current user (or all for admin)
  async getNotifications(req, res) {
    try {
      const user = req.user;
      let notifications;
      if (user.role === 'super_admin') {
        notifications = await Notification.getAll(50);
      } else {
        notifications = await Notification.getForUser(user.id, 20);
      }
      res.json({ success: true, data: notifications });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }
};

module.exports = notificationController;
