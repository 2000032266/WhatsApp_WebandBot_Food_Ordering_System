-- Notifications table for dashboard and user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(32) NOT NULL, -- e.g. order_placed, order_status
  title VARCHAR(128) NOT NULL,
  message TEXT NOT NULL,
  user_id INT NOT NULL, -- who should see this notification (restaurant owner, admin, etc)
  order_id INT DEFAULT NULL,
  status VARCHAR(32) DEFAULT NULL, -- order status if relevant
  read_status TINYINT(1) DEFAULT 0, -- 0 = unread, 1 = read
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
