# WhatsApp Food Ordering System

A complete food ordering system with WhatsApp integration using Twilio API, featuring web ordering, restaurant management, and comprehensive user authentication.

## 📚 Documentation

For complete system documentation, setup instructions, and implementation details, please refer to:

**[📋 COMPLETE_DOCUMENTATION.md](./COMPLETE_DOCUMENTATION.md)**

This comprehensive guide includes:
- Complete installation and setup instructions
- WhatsApp integration details
- Web ordering system implementation
- Restaurant owner command reference
- Payment system documentation
- User authentication and profile management
- Database schema and API endpoints
- Deployment guide and troubleshooting

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   # Install both backend and frontend
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Setup Environment**:
   - Configure `.env` file in backend directory
   - Set up MySQL database
   - Configure Twilio WhatsApp API

3. **Start Application**:
   ```bash
   # Backend (port 5001)
   cd backend && npm start
   
   # Frontend (port 3000/3001)
   cd frontend && npm run dev
   ```

## 🎯 Key Features

- **Dual Ordering System**: WhatsApp + Web ordering
- **Restaurant Management**: Complete dashboard for owners
- **Real-time Notifications**: WhatsApp integration for order updates
- **Payment Integration**: COD and UPI payment support
- **User Authentication**: Support for WhatsApp and web users
- **Admin Panel**: Multi-restaurant system management

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, MySQL
- **Frontend**: React.js, Tailwind CSS, Vite
- **Integration**: Twilio WhatsApp API
- **Authentication**: JWT with bcrypt

For detailed information, troubleshooting, and advanced configuration, see the [complete documentation](./COMPLETE_DOCUMENTATION.md).

## 📞 Support

Having issues? Check the troubleshooting section in the complete documentation or review the implementation guides for specific features.
