import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, MapPin, Phone, Package, IndianRupee, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/customer/orders/${id}`);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Order details fetch error:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepClass = (orderStatus, step) => {
    const statusOrder = {
      'pending': 0,
      'confirmed': 1,
      'preparing': 2, 
      'ready': 3,
      'delivered': 4,
      'cancelled': -1
    };
    
    const currentStep = statusOrder[orderStatus];
    const stepValue = statusOrder[step];
    
    if (orderStatus === 'cancelled') {
      return 'bg-red-500';
    }
    
    if (stepValue <= currentStep) {
      return 'bg-green-500';
    }
    
    return 'bg-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Order not found</h2>
        <button 
          onClick={() => navigate('/orders')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <button 
        onClick={() => navigate('/orders')}
        className="flex items-center text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to My Orders
      </button>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
            <p className="text-gray-600">{order.restaurant_name}</p>
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
            <p className="text-xl font-bold text-gray-900">₹{order.total}</p>
          </div>
        </div>

        {/* Order Status Timeline */}
        {order.status !== 'cancelled' ? (
          <div className="mb-8">
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-gray-300"></div>
              <div className="relative flex justify-between">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full ${getStatusStepClass(order.status, 'pending')} flex items-center justify-center z-10`}>
                    {order.status !== 'cancelled' && getStatusStepClass(order.status, 'pending') === 'bg-green-500' && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs mt-2">Ordered</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full ${getStatusStepClass(order.status, 'confirmed')} flex items-center justify-center z-10`}>
                    {order.status !== 'cancelled' && getStatusStepClass(order.status, 'confirmed') === 'bg-green-500' && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs mt-2">Confirmed</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full ${getStatusStepClass(order.status, 'preparing')} flex items-center justify-center z-10`}>
                    {order.status !== 'cancelled' && getStatusStepClass(order.status, 'preparing') === 'bg-green-500' && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs mt-2">Preparing</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full ${getStatusStepClass(order.status, 'ready')} flex items-center justify-center z-10`}>
                    {order.status !== 'cancelled' && getStatusStepClass(order.status, 'ready') === 'bg-green-500' && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs mt-2">Ready</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full ${getStatusStepClass(order.status, 'delivered')} flex items-center justify-center z-10`}>
                    {order.status !== 'cancelled' && getStatusStepClass(order.status, 'delivered') === 'bg-green-500' && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs mt-2">Delivered</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700 font-medium">This order has been cancelled.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Items */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Order Items</h2>
            <div className="space-y-2">
              {order.items ? order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.item_name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                </div>
              )) : (
                <p className="text-gray-500 italic">Order details not available</p>
              )}
            </div>
            
            {/* Order Total */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Delivery Information</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Delivery Address</p>
                  <p className="text-gray-600">{order.delivery_address}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Contact</p>
                  <p className="text-gray-600">{order.customer_phone}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <IndianRupee className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Payment</p>
                  <p className="text-gray-600">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Payment Status: {order.payment_status}</p>
                </div>
              </div>
              
              {order.notes && (
                <div className="bg-gray-50 p-3 rounded-md mt-3">
                  <p className="font-medium text-gray-900 text-sm">Order Notes:</p>
                  <p className="text-gray-600 text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Need Help?</h2>
        <p className="text-gray-600 mb-4">
          If you have any questions about your order, please contact the restaurant directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Contact Restaurant
          </button>
          <div className="flex items-center bg-blue-50 p-3 rounded-md border border-blue-200">
            <Phone className="w-5 h-5 text-blue-600 mr-2" />
            <p className="text-blue-700 text-sm">You'll receive order updates via WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
