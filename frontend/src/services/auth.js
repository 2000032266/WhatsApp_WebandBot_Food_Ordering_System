import api from './api';

class AuthService {
  // Login user
  static async login(credentials) {
    try {
      console.log('AuthService.login called with:', credentials);
      const response = await api.post('/auth/login', credentials);
      console.log('API response:', response);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Login successful, user:', user);
        
        // Dispatch custom event to notify App component of auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        return { success: true, user, token };
      }
      
      console.log('Login failed:', response.data.message);
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('AuthService.login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  }

  // Register user
  static async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Dispatch custom event to notify App component of auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        return { success: true, user, token };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  }

  // Logout user
  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch custom event to notify App component of auth state change
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    
    window.location.href = '/login';
  }

  // Get current user
  static getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  }

  // Check if user is authenticated
  static isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Get token
  static getToken() {
    return localStorage.getItem('token');
  }

  // Check user role
  static hasRole(role) {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Verify token
  static async verifyToken() {
    try {
      const response = await api.get('/auth/verify-token');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  // Get current user profile from API (includes fields not stored in localStorage)
  static async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get profile'
      };
    }
  }

  // Update profile
  static async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data.success) {
        const updatedUser = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      };
    }
  }

  // Change password
  static async changePassword(passwordData) {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password change failed'
      };
    }
  }
}

export default AuthService;
