const db = require('../db/connection');

class Order {
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        `SELECT o.*, u.name as customer_name, u.phone as customer_phone, r.name as restaurant_name
         FROM orders o
         JOIN users u ON o.user_id = u.id
         JOIN restaurants r ON o.restaurant_id = r.id
         WHERE o.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async getOrderItems(orderId) {
    try {
      const [rows] = await db.execute(
        `SELECT oi.*, mi.name as item_name, mi.description
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = ?`,
        [orderId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(orderData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { 
        user_id, 
        restaurant_id, 
        total, 
        delivery_address, 
        status = 'pending',
        payment_status = 'pending',
        payment_method,
        notes = null 
      } = orderData;

      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (user_id, restaurant_id, total, delivery_address, 
          status, payment_status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id, 
          restaurant_id, 
          total, 
          delivery_address, 
          status,
          payment_status,
          notes
        ]
      );

      const orderId = orderResult.insertId;

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async addItem(orderId, menuItemId, quantity, price) {
    try {
      const [result] = await db.execute(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, menuItemId, quantity, price]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      const [result] = await db.execute(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async updatePaymentStatus(id, paymentStatus) {
    try {
      const [result] = await db.execute(
        'UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [paymentStatus, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getByRestaurant(restaurantId, status = null) {
    try {
      let query = `
        SELECT o.*, u.name as customer_name, u.phone as customer_phone
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.restaurant_id = ?
      `;

      let params = [restaurantId];

      if (status) {
        query += ' AND o.status = ?';
        params.push(status);
      }

      query += ' ORDER BY o.created_at DESC';

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getByUser(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT o.*, r.name as restaurant_name
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         WHERE o.user_id = ?
         ORDER BY o.created_at DESC`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT o.*, u.name as customer_name, u.phone as customer_phone, r.name as restaurant_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE 1=1
      `;

      let params = [];

      if (filters.status) {
        query += ' AND o.status = ?';
        params.push(filters.status);
      }

      if (filters.payment_status) {
        query += ' AND o.payment_status = ?';
        params.push(filters.payment_status);
      }

      if (filters.restaurant_id) {
        query += ' AND o.restaurant_id = ?';
        params.push(filters.restaurant_id);
      }

      query += ' ORDER BY o.created_at DESC';

      if (filters.limit && parseInt(filters.limit) > 0) {
        query += ' LIMIT ' + parseInt(filters.limit);
      }

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getStats(restaurantId = null, dateRange = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
          COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN status = 'delivered' THEN total END), 0) as average_order_value
        FROM orders
        WHERE 1=1
      `;

      let params = [];

      if (restaurantId) {
        query += ' AND restaurant_id = ?';
        params.push(restaurantId);
      }

      if (dateRange) {
        query += ' AND created_at >= ? AND created_at <= ?';
        params.push(dateRange.start, dateRange.end);
      }

      const [rows] = await db.execute(query, params);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find orders by user ID (for customer orders)
  static async findByUserId(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT o.*, r.name as restaurant_name
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         WHERE o.user_id = ?
         ORDER BY o.created_at DESC`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByRestaurantAndStatus(restaurantId, statuses) {
    try {
      // Create placeholders for status array
      const statusPlaceholders = statuses.map(() => '?').join(',');
      
      const [rows] = await db.execute(
        `SELECT o.*, u.name as customer_name, u.phone as customer_phone, r.name as restaurant_name
         FROM orders o
         JOIN users u ON o.user_id = u.id
         JOIN restaurants r ON o.restaurant_id = r.id
         WHERE o.restaurant_id = ? AND o.status IN (${statusPlaceholders})
         ORDER BY o.created_at DESC`,
        [restaurantId, ...statuses]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Order;
