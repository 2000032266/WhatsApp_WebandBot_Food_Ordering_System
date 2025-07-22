const db = require('../db/connection');

class Message {
  static async create(messageData) {
    try {
      const { user_id = null, phone, message, type, message_sid = null } = messageData;
      
      if (!phone || !message) {
        throw new Error('Phone and message are required');
      }
      
      // Validate type - ensure it's one of the allowed values
      // Database schema has ENUM('incoming', 'outgoing', 'button_reply')
      const validTypes = ['incoming', 'outgoing', 'button_reply'];
      // Map sent -> outgoing, received -> incoming
      let safeType = 'incoming';
      if (type === 'sent') safeType = 'outgoing';
      else if (validTypes.includes(type)) safeType = type;
      
      console.log(`Creating message with type: ${safeType} (original: ${type})`);
      
      const [result] = await db.execute(
        'INSERT INTO messages (user_id, phone, message, type, message_sid) VALUES (?, ?, ?, ?, ?)',
        [user_id || null, phone, message, safeType, message_sid || null]
      );
      return result.insertId;
    } catch (error) {
      console.error('Message creation error:', error);
      throw error;
    }
  }

  static async getByPhone(phone, limit = 50) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM messages WHERE phone = ? ORDER BY created_at DESC LIMIT ?',
        [phone, limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(filters = {}) {
    try {
      let query = 'SELECT m.*, u.name as user_name FROM messages m LEFT JOIN users u ON m.user_id = u.id WHERE 1=1';
      let params = [];

      if (filters.phone) {
        query += ' AND m.phone = ?';
        params.push(filters.phone);
      }

      if (filters.type) {
        query += ' AND m.type = ?';
        params.push(filters.type);
      }

      if (filters.dateFrom) {
        query += ' AND m.created_at >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        query += ' AND m.created_at <= ?';
        params.push(filters.dateTo);
      }

      query += ' ORDER BY m.created_at DESC';

      if (filters.limit && parseInt(filters.limit) > 0) {
        query += ' LIMIT ' + parseInt(filters.limit);
      }

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getStats() {
    try {
      const [rows] = await db.execute(`
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN type = 'incoming' THEN 1 END) as incoming_messages,
          COUNT(CASE WHEN type = 'outgoing' THEN 1 END) as outgoing_messages,
          COUNT(CASE WHEN type = 'button_reply' THEN 1 END) as button_replies,
          COUNT(DISTINCT phone) as unique_users
        FROM messages
      `);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Message;
