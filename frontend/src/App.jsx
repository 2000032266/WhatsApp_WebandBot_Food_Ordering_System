import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomToaster from './components/CustomToaster';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerOrders from './pages/CustomerOrders';
import RestaurantMenu from './pages/RestaurantMenu';
import Checkout from './pages/Checkout';
import OrderDetails from './pages/OrderDetails';
import Orders from './pages/Orders';
import MenuManagement from './pages/MenuManagement';
import AdminDashboard from './pages/AdminDashboard';
import Users from './pages/Users';
import Restaurants from './pages/Restaurants';
import Messages from './pages/Messages';
import ProtectedRoute from './components/ProtectedRoute';
import AuthService from './services/auth';
import useRealTimeNotifications from './hooks/useRealTimeNotifications';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());
  const [user, setUser] = useState(AuthService.getCurrentUser());
  
  // Initialize real-time notifications if user is authenticated
  const { connected } = useRealTimeNotifications();

  // Listen for authentication changes
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = AuthService.isAuthenticated();
      const currentUser = AuthService.getCurrentUser();
      setIsAuthenticated(authenticated);
      setUser(currentUser);
    };

    // Check authentication on component mount
    checkAuth();

    // Listen for storage changes (when localStorage is updated)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event listener for manual auth updates
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <CustomToaster />
        
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Login />
              )
            } 
          />
          
          <Route 
            path="/register" 
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Register />
              )
            } 
          />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute />}>
            {/* Customer Routes */}
            <Route index element={
              user?.role === 'customer' ? <CustomerDashboard /> :
              user?.role === 'restaurant_owner' ? <Dashboard /> :
              user?.role === 'super_admin' ? <AdminDashboard /> :
              <Navigate to="/login" replace />
            } />
            
            {/* Web Ordering Routes */}
            <Route path="restaurants/:id/menu" element={
              user?.role === 'customer' ? <RestaurantMenu /> :
              <Navigate to="/" replace />
            } />
            
            <Route path="checkout" element={
              user?.role === 'customer' ? <Checkout /> :
              <Navigate to="/" replace />
            } />
            
            <Route path="orders/:id" element={
              user?.role === 'customer' ? <OrderDetails /> :
              <Navigate to="/" replace />
            } />

            {/* Restaurant Owner Dashboard Route */}
            <Route path="dashboard" element={
              user?.role === 'restaurant_owner' ? <Dashboard /> :
              <Navigate to="/" replace />
            } />
            
            {/* Orders route - available to all authenticated users */}
            <Route path="orders" element={
              user?.role === 'customer' ? <CustomerOrders /> :
              (user?.role === 'restaurant_owner' || user?.role === 'super_admin') ? <Orders /> :
              <Navigate to="/" replace />
            } />
            
            {/* Menu route - only for restaurant owners */}
            <Route path="menu" element={
              user?.role === 'restaurant_owner' ? <MenuManagement /> :
              <Navigate to="/" replace />
            } />
            
            {/* Users route - only for super admin */}
            <Route path="users" element={
              user?.role === 'super_admin' ? <Users /> :
              <Navigate to="/" replace />
            } />
            
            {/* Restaurants route - only for super admin */}
            <Route path="restaurants" element={
              user?.role === 'super_admin' ? <Restaurants /> :
              <Navigate to="/" replace />
            } />
            
            {/* Messages route - only for super admin */}
            <Route path="messages" element={
              user?.role === 'super_admin' ? <Messages /> :
              <Navigate to="/" replace />
            } />

            {/* Fallback for any other routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
