const db = require('../db/connection');

class MenuItem {
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM menu_items WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findByRestaurant(restaurantId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name',
        [restaurantId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getAvailableByRestaurant(restaurantId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = TRUE ORDER BY category, name',
        [restaurantId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(menuItemData) {
    try {
      const { restaurant_id, name, description, price, category, image_url } = menuItemData;
      const [result] = await db.execute(
        'INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [restaurant_id, name, description, price, category, image_url]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, menuItemData) {
    try {
      const { name, description, price, category, is_available, image_url } = menuItemData;
      const [result] = await db.execute(
        'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, is_available = ?, image_url = ? WHERE id = ?',
        [name, description, price, category, is_available, image_url, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM menu_items WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async toggleAvailability(id) {
    try {
      const [result] = await db.execute(
        'UPDATE menu_items SET is_available = NOT is_available WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getCategories(restaurantId) {
    try {
      const [rows] = await db.execute(
        'SELECT DISTINCT category FROM menu_items WHERE restaurant_id = ? AND category IS NOT NULL ORDER BY category',
        [restaurantId]
      );
      return rows.map(row => row.category);
    } catch (error) {
      throw error;
    }
  }

  static async getBestSellers(restaurantId = null, limit = 5) {
    try {
      let query = `
        SELECT 
          mi.*, 
          SUM(oi.quantity) as total_sold,
          COUNT(DISTINCT oi.order_id) as orders_count
        FROM menu_items mi
        JOIN order_items oi ON mi.id = oi.menu_item_id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'delivered'
      `;

      let params = [];
      if (restaurantId) {
        query += ' AND mi.restaurant_id = ?';
        params.push(restaurantId);
      }

      query += ' GROUP BY mi.id ORDER BY total_sold DESC LIMIT ?';
      params.push(limit || 5); // Default to 5 if no limit provided

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MenuItem;
