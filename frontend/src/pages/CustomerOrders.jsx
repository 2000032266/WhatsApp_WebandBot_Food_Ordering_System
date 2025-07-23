import { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, Package, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/customer/orders');
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (error) {
      console.error('Orders fetch error:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <Package className="w-4 h-4" />;
      case 'confirmed':
      case 'preparing':
      case 'ready':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track your food orders and order history</p>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">You haven't placed any orders yet. Start by browsing restaurants!</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {/* Order Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id}
                    </h3>
                    <p className="text-gray-600">{order.restaurant_name || 'Restaurant'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(order.status)}
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">₹{order.total}</p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-2">
                      {order.items ? order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-900">{item.item_name || item.name}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                        </div>
                      )) : (
                        <p className="text-gray-500 italic">Order details not available</p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Delivery Information</h4>
                    <div className="space-y-3">
                      {order.delivery_address && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">Delivery Address</p>
                            <p className="text-gray-600">{order.delivery_address}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">Contact</p>
                          <p className="text-gray-600">Order placed via WhatsApp</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <IndianRupee className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">Payment</p>
                          <p className="text-gray-600">Cash on Delivery</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Need help? Contact the restaurant via WhatsApp
                  </div>
                  <div className="flex space-x-3">
                    {order.status === 'delivered' && (
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        Rate Order
                      </button>
                    )}
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Order Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
