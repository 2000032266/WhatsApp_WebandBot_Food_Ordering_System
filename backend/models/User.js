const db = require('../db/connection');

class User {
  static async findByPhone(phone) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE phone = ?',
        [phone]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async create(userData) {
    try {
      const { name, phone, password, role = 'customer' } = userData;
      const [result] = await db.execute(
        'INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)',
        [name, phone, password, role]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async updateWhatsAppState(phone, state, cart = null) {
    try {
      const [result] = await db.execute(
        'UPDATE users SET whatsapp_state = ?, cart = ? WHERE phone = ?',
        [state, cart ? JSON.stringify(cart) : null, phone]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getCart(phone) {
    try {
      const user = await this.findByPhone(phone);
      if (user && user.cart) {
        return JSON.parse(user.cart);
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  static async addToCart(phone, menuItemId, quantity = 1) {
    try {
      const cart = await this.getCart(phone);
      
      const existingItem = cart.find(item => item.menuItemId === menuItemId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({ menuItemId, quantity });
      }

      await this.updateWhatsAppState(phone, 'browsing', cart);
      return cart;
    } catch (error) {
      throw error;
    }
  }

  static async clearCart(phone) {
    try {
      await this.updateWhatsAppState(phone, 'idle', []);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(role = null) {
    try {
      let query = 'SELECT id, name, phone, role, created_at FROM users';
      let params = [];

      if (role) {
        query += ' WHERE role = ?';
        params.push(role);
      }

      query += ' ORDER BY created_at DESC';

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, userData) {
    try {
      // Build SET clause and parameters dynamically
      const fields = Object.keys(userData);
      const values = Object.values(userData);
      
      if (fields.length === 0) {
        return false;
      }
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const params = [...values, id]; // Add id as the last parameter
      
      const [result] = await db.execute(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        params
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('User update error:', error);
      throw error;
    }
  }
}

module.exports = User;
