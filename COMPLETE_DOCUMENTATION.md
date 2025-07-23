# WhatsApp Food Ordering System - Complete Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [WhatsApp Integration](#whatsapp-integration)
5. [Web Ordering System](#web-ordering-system)
6. [Restaurant Owner Commands](#restaurant-owner-commands)
7. [User Authentication & Login](#user-authentication--login)
8. [Payment System](#payment-system)
9. [Profile Settings](#profile-settings)
10. [Database Schema](#database-schema)
11. [API Endpoints](#api-endpoints)
12. [Deployment Guide](#deployment-guide)
13. [Troubleshooting](#troubleshooting)

---

## 🚀 System Overview

A complete food ordering system with WhatsApp integration using Twilio API, featuring a responsive web dashboard for restaurant management, web ordering capabilities, and comprehensive user management.

### Technology Stack
- **Backend**: Node.js, Express.js, MySQL, Twilio WhatsApp API
- **Frontend**: React.js, Tailwind CSS, Vite
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: MySQL with proper relationships
- **Real-time**: WebSocket notifications
- **Styling**: Tailwind CSS with Lucide React icons

---

## 🎯 Features

### WhatsApp Integration
- **Customer Features**: 
  - Browse menu via interactive buttons
  - Add items to cart using WhatsApp buttons
  - Checkout and receive order confirmation
  - Real-time order status updates
  - Payment instructions and confirmation
- **Restaurant Owner Features**: 
  - Receive new order notifications
  - Accept/reject orders via WhatsApp commands
  - Update order status through text commands
  - Payment confirmation management
  - Order completion workflow

### Web Dashboard
- **Customer Dashboard**: Browse restaurants, place orders online, track order history
- **Restaurant Owner Dashboard**: Menu management, order tracking, payment status, analytics
- **Super Admin Dashboard**: Multi-restaurant management, user management, system analytics
- **Real-time Notifications**: Live order updates and status changes

### Dual Ordering System
- **WhatsApp Ordering**: Complete ordering flow through WhatsApp interface
- **Web Ordering**: Online ordering with shopping cart and checkout
- **Unified Backend**: Both systems share the same order management

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Twilio Account with WhatsApp API access
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd WhatsApp_Web_Food_Ordering_System
```

### 2. Install Dependencies
```bash
# Install both backend and frontend dependencies
npm run install-all

# Or install separately
cd backend && npm install
cd ../frontend && npm install
```

### 3. Environment Setup
Create `.env` file in the backend directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=whatsapp_food_ordering

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Server Configuration
PORT=5001
NODE_ENV=development
```

### 4. Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE whatsapp_food_ordering;

# Run schema
cd backend/db
mysql -u root -p whatsapp_food_ordering < schema.sql

# Initialize with sample data (optional)
node initialize-database.js
```

### 5. Start Application
```bash
# Start backend (from root directory)
cd backend && npm start

# Start frontend (in another terminal, from root directory)
cd frontend && npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000 (or 3001 if 3000 is busy)
- Backend API: http://localhost:5001
- WhatsApp Webhook: http://localhost:5001/api/whatsapp/webhook

---

## 📱 WhatsApp Integration

### Customer Journey
1. **Initial Contact**: Send any message to the WhatsApp number
2. **Restaurant Selection**: Receive interactive buttons with available restaurants
3. **Menu Browsing**: Navigate through menu categories using buttons
4. **Cart Management**: Add items, view cart, modify quantities
5. **Checkout Process**: Choose payment method (COD/UPI), provide delivery details
6. **Order Tracking**: Receive real-time status updates
7. **Payment Confirmation**: Get payment instructions and confirm payment

### Restaurant Owner Workflow
1. **Order Reception**: Receive new order notifications with complete details
2. **Order Management**: Accept/reject orders using WhatsApp commands
3. **Status Updates**: Update order preparation and delivery status
4. **Payment Handling**: Confirm payment receipt before delivery
5. **Completion**: Mark orders as delivered and complete the cycle

### WhatsApp Commands for Restaurant Owners
All commands are case-insensitive and follow the pattern: `COMMAND ORDER_ID`

#### Available Commands:

**ORDERS**
- View all pending orders for your restaurant
- Example: `ORDERS`
- Shows list of all pending/confirmed/ready orders with customer details

**ACCEPT [order_id]**
- Accept a pending order
- Example: `ACCEPT 123`
- Changes order status to 'confirmed'
- Sends confirmation notification to customer

**REJECT [order_id]**
- Reject a pending order
- Example: `REJECT 123`
- Changes order status to 'rejected'
- Notifies customer with rejection message

**READY [order_id]**
- Mark order as ready for pickup/delivery
- Example: `READY 123`
- Changes order status to 'ready'
- Sends pickup notification to customer

**PAID [order_id]**
- Confirm payment has been received
- Example: `PAID 123`
- Updates payment status to 'paid'
- Required before marking as delivered (except COD)

**DELIVERED [order_id]**
- Mark order as successfully delivered
- Example: `DELIVERED 123`
- Changes order status to 'delivered'
- For COD: Automatically marks payment as received

### Order Status Flow
```
New Order → pending
           ↓ (ACCEPT command)
        confirmed
           ↓ (READY command)
         ready
           ↓ (PAID command - UPI/Online only)
    ready (paid)
           ↓ (DELIVERED command)
      delivered

Alternative flow:
pending → (REJECT command) → rejected
```

### Payment Flow Differences

**UPI/Online Orders:**
```
ready → PAID → DELIVERED → delivered
```

**COD (Cash on Delivery) Orders:**
```
ready → DELIVERED → delivered (auto-paid)
```

---

## 🌐 Web Ordering System

### Customer Web Ordering
1. **Restaurant Selection**: Browse available restaurants on customer dashboard
2. **Menu Browsing**: View categorized menu items with descriptions and prices
3. **Cart Management**: Add/remove items, adjust quantities
4. **Checkout Process**: Enter delivery details, add special instructions
5. **Order Confirmation**: Receive order confirmation and WhatsApp notification
6. **Order Tracking**: Monitor order status through web interface

### Architecture

#### Frontend Components
- `CustomerDashboard.jsx` - Main customer interface with restaurant listings
- `RestaurantMenu.jsx` - Menu display with cart functionality
- `Checkout.jsx` - Order checkout and confirmation
- `CustomerOrders.jsx` - Order history and tracking
- `OrderDetails.jsx` - Detailed order information and status timeline

#### Backend Endpoints
- `GET /customer/restaurants` - Get available restaurants
- `GET /restaurants/:id` - Get restaurant details
- `GET /restaurants/:id/menu` - Get restaurant menu items
- `POST /customer/orders` - Create a new order
- `GET /customer/orders` - Get customer order history
- `GET /customer/orders/:id` - Get specific order details

### Data Flow
1. Customer selects restaurant → fetches menu
2. Items added to cart → stored in localStorage
3. Checkout → creates order in database
4. WhatsApp notifications sent to both customer and restaurant
5. Order appears in restaurant owner dashboard
6. Status updates reflected in customer interface

---

## 👤 User Authentication & Login

### User Types
1. **Customers**: Users who place orders (WhatsApp or Web)
2. **Restaurant Owners**: Manage restaurants and orders
3. **Super Admins**: System administrators

### WhatsApp User Integration
Users who order via WhatsApp are automatically registered with null passwords.

#### Login Process for WhatsApp Users
- **Username**: Phone number used for WhatsApp orders
- **Default Password**: `whatsapp123`
- **First-time Setup**: Users can change password after first login

#### Backend Authentication Logic
```javascript
// Special handling for WhatsApp users with null password
let isPasswordValid = false;

if (user.password === null) {
  // For WhatsApp users with null password, check against default
  const defaultWhatsAppPassword = "whatsapp123";
  isPasswordValid = (password === defaultWhatsAppPassword);
} else {
  // Normal password check for users with set passwords
  isPasswordValid = await bcrypt.compare(password, user.password);
}
```

#### Frontend Integration
- Login form includes instructions for WhatsApp users
- Registration form advises WhatsApp users to use login instead
- Profile settings allow password changes for WhatsApp users

---

## 💳 Payment System

### Payment Methods Supported
1. **Cash on Delivery (COD)** - Default method
2. **UPI Payments** - With payment verification workflow

### Payment Status Workflow

#### Database Schema
```sql
payment_status ENUM('pending', 'awaiting_payment', 'paid', 'failed')
```

#### COD Orders
- Payment status starts as 'pending'
- Automatically marked as 'paid' when delivered
- No payment verification required

#### UPI/Online Orders
- Payment status starts as 'pending'
- Customer receives UPI payment instructions
- Restaurant owner confirms payment with PAID command
- Order can only be delivered after payment confirmation

### UPI Payment Instructions
```
🏦 Payment Details:
UPI ID: 7032107890-2@ibl
Amount: ₹[order_total]
Order ID: #[order_id]

After payment:
1. Take screenshot of payment
2. Restaurant will verify payment
3. Order will be prepared after confirmation
```

---

## ⚙️ Profile Settings

### Features
- **Modal-based interface** with professional design
- **Two-tab system**: Profile Information & Security
- **WhatsApp user detection** and guidance
- **Real-time validation** and error handling

#### Profile Information Tab
- Edit full name, phone number, email
- View user role and registration date
- Upload profile picture (future enhancement)

#### Security Tab
- Change password with current password verification
- Special handling for WhatsApp users (null passwords)
- Password strength requirements
- Security guidelines and warnings

### Implementation Details

#### Frontend Component
```jsx
// ProfileSettings.jsx - Modal-based profile management
- Two-tab interface (Profile & Security)
- Form validation and error handling
- API integration for updates
- WhatsApp user detection
```

#### Backend Updates
```javascript
// Enhanced password change handling
if (user.password === null) {
  // WhatsApp user - no current password verification needed
  // Allow direct password setting
} else {
  // Regular user - verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
}
```

---

## 🗄️ Database Schema

### Core Tables

#### users
```sql
id INT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(255) NOT NULL,
phone VARCHAR(20) UNIQUE NOT NULL,
email VARCHAR(255) UNIQUE,
password VARCHAR(255), -- NULL for WhatsApp users
role ENUM('customer', 'restaurant_owner', 'super_admin'),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### restaurants
```sql
id INT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(255) NOT NULL,
owner_id INT REFERENCES users(id),
address TEXT,
phone VARCHAR(20),
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### menu_items
```sql
id INT PRIMARY KEY AUTO_INCREMENT,
restaurant_id INT REFERENCES restaurants(id),
name VARCHAR(255) NOT NULL,
description TEXT,
price DECIMAL(10,2) NOT NULL,
category VARCHAR(100),
is_available BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### orders
```sql
id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT REFERENCES users(id),
restaurant_id INT REFERENCES restaurants(id),
total DECIMAL(10,2) NOT NULL,
status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'),
payment_status ENUM('pending', 'awaiting_payment', 'paid', 'failed'),
payment_method VARCHAR(50),
delivery_address TEXT,
notes TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### order_items
```sql
id INT PRIMARY KEY AUTO_INCREMENT,
order_id INT REFERENCES orders(id),
menu_item_id INT REFERENCES menu_items(id),
quantity INT NOT NULL,
price DECIMAL(10,2) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### messages
```sql
id INT PRIMARY KEY AUTO_INCREMENT,
phone VARCHAR(20) NOT NULL,
message TEXT NOT NULL,
direction ENUM('incoming', 'outgoing'),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Customer Endpoints
- `GET /api/customer/restaurants` - Get available restaurants
- `GET /api/customer/orders` - Get customer orders
- `POST /api/customer/orders` - Create new order
- `GET /api/customer/orders/:id` - Get specific order details

### Restaurant Endpoints
- `GET /api/restaurant/orders` - Get restaurant orders
- `PUT /api/restaurant/orders/:id/status` - Update order status
- `PUT /api/restaurant/orders/:id/payment` - Update payment status
- `GET /api/restaurant/menu` - Get restaurant menu
- `POST /api/restaurant/menu` - Add menu item
- `PUT /api/restaurant/menu/:id` - Update menu item
- `DELETE /api/restaurant/menu/:id` - Delete menu item
- `GET /api/restaurant/orders/download/csv` - **Download orders as CSV** (Enhanced format)

#### CSV Export Features
The CSV export functionality provides:
- **Proper CSV formatting** with field escaping
- **Complete order information** including items, customer details, payment info
- **Excel compatibility** with UTF-8 BOM support
- **Filter support** - export all orders or filtered by status
- **Descriptive filenames** with date and filter information
- **Enhanced error handling** with timeout support

**CSV Format includes:**
- Order ID, Date & Time (separate columns)
- Customer information (name, phone)
- Restaurant name
- Detailed order items with quantities and prices
- Payment and delivery information
- Special notes and instructions

### Admin Endpoints
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/restaurants` - Get all restaurants
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics` - Get system analytics

### WhatsApp Webhook
- `POST /api/whatsapp/webhook` - Twilio WhatsApp webhook

---

## 🚀 Deployment Guide

### Environment Setup
1. Set up production database (MySQL on cloud)
2. Configure Twilio WhatsApp sandbox or production number
3. Set up SSL certificates for webhook security
4. Configure environment variables for production

### Backend Deployment Options
- **Heroku**: Easy deployment with database add-ons
- **Railway**: Modern platform with automatic deployments
- **DigitalOcean App Platform**: Scalable container deployment
- **AWS EC2**: Full control with custom setup

### Frontend Deployment Options
- **Vercel**: Automatic deployments from Git
- **Netlify**: Continuous deployment with build optimization
- **AWS S3 + CloudFront**: Static hosting with CDN

### Database Options
- **PlanetScale**: Serverless MySQL platform
- **AWS RDS**: Managed MySQL service
- **Google Cloud SQL**: Managed database service
- **Heroku Postgres**: Easy PostgreSQL hosting (with schema modifications)

### Production Configuration
```env
# Production environment variables
NODE_ENV=production
DB_HOST=your-production-db-host
TWILIO_WHATSAPP_NUMBER=whatsapp:+your-production-number
FRONTEND_URL=https://your-frontend-domain.com
WEBHOOK_URL=https://your-backend-domain.com/api/whatsapp/webhook
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### WhatsApp Integration Issues

**Issue**: Webhook not receiving messages
**Solution**: 
- Verify webhook URL is publicly accessible
- Check Twilio console for webhook configuration
- Ensure SSL certificate is valid

**Issue**: ORDERS command returns undefined error
**Solution**: 
- Check restaurant ownership validation
- Verify `Restaurant.findByOwnerId()` returns array
- Ensure proper array handling in controller

#### Database Issues

**Issue**: Payment status enum error
**Solution**:
```sql
ALTER TABLE orders 
MODIFY COLUMN payment_status ENUM('pending', 'awaiting_payment', 'paid', 'failed') DEFAULT 'pending';
```

**Issue**: Order items not displaying
**Solution**:
- Verify `getMyOrders` endpoint includes order items
- Check frontend uses `item.item_name || item.name`
- Ensure `Order.getOrderItems()` query is correct

#### Authentication Issues

**Issue**: WhatsApp users cannot login
**Solution**:
- Verify users have null passwords in database
- Check default password logic in authentication
- Ensure frontend shows WhatsApp login instructions

**Issue**: Profile settings not opening
**Solution**:
- Check modal state management in Header component
- Verify ProfileSettings component is properly imported
- Ensure click handlers are correctly bound

#### Payment Issues

**Issue**: UPI payment status not updating
**Solution**:
- Verify PAID command implementation
- Check payment status workflow in controller
- Ensure database enum supports 'awaiting_payment'

#### CSV Export Issues

**Issue**: CSV download creates incorrectly formatted file
**Solution**:
- CSV export now uses proper field escaping
- Added UTF-8 BOM for Excel compatibility
- Enhanced with complete order information
- Files open correctly in Excel with proper column separation

**Issue**: Missing payment method in CSV export
**Solution**:
- Removed non-existent `payment_method` field from database query
- Defaulted to "Not specified" in the CSV output
- Enhanced order items formatting with better readability
- Separate date and time columns for better sorting

### Logging and Debugging
- Enable detailed logging in production
- Use webhook debugging tools for WhatsApp integration
- Monitor database query performance
- Set up error tracking (e.g., Sentry)

### Performance Optimization
- Implement database indexing for frequently queried fields
- Add caching layer (Redis) for menu items
- Optimize image delivery with CDN
- Implement lazy loading for order history

---

## 📞 Support & Contributing

### Getting Help
- Review this documentation thoroughly
- Check the troubleshooting section
- Test with WhatsApp sandbox before production
- Use browser developer tools for frontend debugging

### Development Guidelines
- Follow existing code structure and naming conventions
- Test all WhatsApp workflows thoroughly
- Ensure database migrations are properly documented
- Maintain backward compatibility when possible

### Future Enhancements
- Multiple restaurant support per owner
- Advanced payment gateway integration
- Real-time order tracking with GPS
- Customer rating and review system
- Loyalty program and discounts
- Multi-language support
- Mobile app development

---

**Last Updated**: January 2024
**Version**: 2.0
**System Status**: Production Ready ✅
