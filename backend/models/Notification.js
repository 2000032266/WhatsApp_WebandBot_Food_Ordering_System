const db = require('../db/connection');

const Notification = {
  /**
   * Create a new notification
   * @param {Object} data
   * @param {string} data.type - Notification type (order_placed, order_status, etc)
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {number} data.user_id - User to notify (restaurant owner or admin)
   * @param {number} [data.order_id] - Related order id
   * @param {string} [data.status] - Order status (if applicable)
   * @returns {Promise<number>} Notification id
   */
  async create({ type, title, message, user_id, order_id = null, status = null }) {
    const [result] = await db.execute(
      `INSERT INTO notifications (type, title, message, user_id, order_id, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [type, title, message, user_id, order_id, status]
    );
    return result.insertId;
  },

  /**
   * Get notifications for a user (or all if user_id is null)
   */


  async getForUser(user_id, limit = 20) {
    // MySQL2 requires LIMIT to be a plain number, not a string or undefined
    const safeLimit = parseInt(limit, 10) || 20;
    const safeUserId = parseInt(user_id, 10);
    if (isNaN(safeUserId)) return [];
    const [rows] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ${safeLimit}`,
      [safeUserId]
    );
    return rows;
  },

  /**
   * Get all notifications (admin)
   */
  async getAll(limit = 50) {
    const safeLimit = parseInt(limit, 10) || 50;
    const [rows] = await db.query(
      `SELECT * FROM notifications ORDER BY created_at DESC LIMIT ${safeLimit}`
    );
    return rows;
  }
};

module.exports = Notification;
