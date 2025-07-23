import { useState, useEffect } from 'react';
import { ShoppingBag, Clock, MapPin, Phone, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import AuthService from '../services/auth';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderingViaWhatsApp, setOrderingViaWhatsApp] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      // Fetch available restaurants
      const restaurantsResponse = await api.get('/restaurants');
      if (restaurantsResponse.data.success) {
        setRestaurants(restaurantsResponse.data.data.restaurants || []);
      }

      // Fetch customer's recent orders
      try {
        const ordersResponse = await api.get('/api/customer/orders');
        if (ordersResponse.data.success) {
          setRecentOrders(ordersResponse.data.data.orders || []);
        }
      } catch (orderError) {
        console.log('No orders endpoint available for customer');
        setRecentOrders([]);
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Customer dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWhatsAppOrdering = async (restaurant) => {
    try {
      setOrderingViaWhatsApp(true);
      
      // Get current user phone number
      const user = AuthService.getCurrentUser();
      const userPhone = user?.phone?.replace(/[^\d]/g, ''); // Remove any non-digit characters
      
      if (!userPhone) {
        toast.error('Phone number not found in your profile. Please update your profile with a valid phone number.');
        return;
      }

      // Start WhatsApp ordering flow
      const response = await api.post('/api/whatsapp/start-order', {
        phone: userPhone
      });

      if (response.data.success) {
        toast.success('🎉 WhatsApp ordering started! Check your WhatsApp for menu options.');
        
        // Show instructions modal
        showWhatsAppInstructions(userPhone, restaurant.name);
      } else {
        toast.error('Failed to start WhatsApp ordering. Please try again.');
      }
    } catch (error) {
      console.error('Error starting WhatsApp order:', error);
      if (error.response?.status === 400) {
        toast.error('Please make sure your phone number is valid in your profile.');
      } else {
        toast.error('Error starting WhatsApp ordering. Please try again later.');
      }
    } finally {
      setOrderingViaWhatsApp(false);
    }
  };

  const showWhatsAppInstructions = (phone, restaurantName) => {
    // Create a modal-like alert with detailed instructions
    const instructions = `📱 WhatsApp Ordering Started!

✅ A message has been sent to your WhatsApp: ${phone}

📋 How it works:
1. Check your WhatsApp messages now
2. You'll see a list of available restaurants
3. Reply with restaurant number (1, 2, 3...)
4. Browse menu categories by replying with numbers
5. Add items to cart by selecting item numbers
6. View your cart and proceed to checkout
7. Provide delivery details when prompted
8. Confirm your order and wait for delivery!

💡 Tips:
• Always reply with numbers (1, 2, 3...) to navigate
• You can view your cart anytime during ordering
• Delivery usually takes 30-45 minutes
• Payment is Cash on Delivery

🍽️ Enjoy your meal! 🛍️`;
    
    alert(instructions);
  };

  const handleOrderFromRestaurant = (restaurant, method = 'whatsapp') => {
    if (method === 'whatsapp') {
      startWhatsAppOrdering(restaurant);
    } else if (method === 'web') {
      navigate(`/restaurants/${restaurant.id}/menu`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Food Ordering!</h1>
        <p className="text-gray-600">Order delicious food from our partner restaurants via WhatsApp</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">{restaurants.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Orders</p>
              <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ordering Method</p>
              <p className="text-lg font-bold text-gray-900">WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Order */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📱 How to Order via WhatsApp</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-green-600">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Choose Restaurant</h3>
            <p className="text-gray-600 text-sm">Browse available restaurants below and click "Order via WhatsApp"</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-green-600">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Interactive WhatsApp Menu</h3>
            <p className="text-gray-600 text-sm">Receive automated menu options and navigate by replying with numbers</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-green-600">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Complete Your Order</h3>
            <p className="text-gray-600 text-sm">Add items to cart, provide delivery details, and confirm your order</p>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Pro Tips:</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Always reply with numbers (1, 2, 3...) to navigate the menu</li>
            <li>• You can view your cart anytime during the ordering process</li>
            <li>• Delivery typically takes 30-45 minutes</li>
            <li>• Payment is Cash on Delivery (COD)</li>
            <li>• You'll receive order status updates via WhatsApp</li>
          </ul>
        </div>
      </div>

      {/* Available Restaurants */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🍽️ Available Restaurants</h2>
        
        {restaurants.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants available</h3>
            <p className="text-gray-500">Check back later for restaurant listings</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{restaurant.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{restaurant.description || 'Delicious food awaits!'}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">4.5</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {restaurant.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {restaurant.phone}
                    </div>
                  )}
                  {restaurant.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {restaurant.address}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOrderFromRestaurant(restaurant, 'web')}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Order Online
                  </button>
                  <button
                    onClick={() => handleOrderFromRestaurant(restaurant, 'whatsapp')}
                    disabled={orderingViaWhatsApp}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {orderingViaWhatsApp ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        <span>WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Recent Orders</h2>
          <div className="space-y-4">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600">{order.restaurant_name}</p>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{order.total}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
