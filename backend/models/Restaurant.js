const db = require('../db/connection');

class Restaurant {
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        `SELECT r.*, u.name as owner_name, u.phone as owner_phone 
         FROM restaurants r 
         JOIN users u ON r.owner_id = u.id 
         WHERE r.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findByOwnerId(ownerId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM restaurants WHERE owner_id = ?',
        [ownerId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute(
        `SELECT r.*, u.name as owner_name, u.phone as owner_phone 
         FROM restaurants r 
         JOIN users u ON r.owner_id = u.id 
         ORDER BY r.created_at DESC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(restaurantData) {
    try {
      const { name, owner_id, phone, address } = restaurantData;
      const [result] = await db.execute(
        'INSERT INTO restaurants (name, owner_id, phone, address) VALUES (?, ?, ?, ?)',
        [name, owner_id, phone, address]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, restaurantData) {
    try {
      // Build SET clause and parameters dynamically
      const fields = Object.keys(restaurantData).filter(key => restaurantData[key] !== undefined);
      const values = fields.map(field => restaurantData[field]);
      
      if (fields.length === 0) {
        return false;
      }
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const params = [...values, id]; // Add id as the last parameter
      
      const [result] = await db.execute(
        `UPDATE restaurants SET ${setClause} WHERE id = ?`,
        params
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Restaurant update error:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM restaurants WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getStats(restaurantId = null) {
    try {
      let query = `
        SELECT 
          COUNT(DISTINCT r.id) as total_restaurants,
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END), 0) as total_revenue,
          COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders
        FROM restaurants r
        LEFT JOIN orders o ON r.id = o.restaurant_id
      `;

      let params = [];
      if (restaurantId) {
        query += ' WHERE r.id = ?';
        params.push(restaurantId);
      }

      const [rows] = await db.execute(query, params);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getMenu(restaurantId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1 ORDER BY category, name',
        [restaurantId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Restaurant;
