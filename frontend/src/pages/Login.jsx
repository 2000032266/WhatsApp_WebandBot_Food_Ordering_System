import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthService from '../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with:', formData);
      const result = await AuthService.login(formData);
      console.log('Login result:', result);
      
      if (result.success) {
        toast.success('Login successful!');
        navigate('/', { replace: true });
      } else {
        console.error('Login failed:', result.message);
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-whatsapp-500 rounded-full flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            WhatsApp Food Ordering
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your dashboard
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Credentials</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-700">Super Admin:</p>
                <p>Phone: +1234567890</p>
                <p>Password: admin123</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-700">Restaurant Owner:</p>
                <p>Phone: +1234567891</p>
                <p>Password: owner123</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-700">Customer:</p>
                <p>Phone: +1234567892</p>
                <p>Password: customer123</p>
              </div>
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <p className="font-medium text-green-700">WhatsApp Users:</p>
                <p>If you've ordered via WhatsApp, you can login with your phone number.</p>
                <p>Default Password: <span className="font-semibold">whatsapp123</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact support for access credentials.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
