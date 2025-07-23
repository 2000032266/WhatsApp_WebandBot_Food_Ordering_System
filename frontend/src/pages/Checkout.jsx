import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Check, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import AuthService from '../services/auth';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get cart from localStorage
    const storedCart = localStorage.getItem('foodOrderCart');
    if (!storedCart) {
      toast.error('Your cart is empty');
      navigate('/');
      return;
    }
    
    setCartData(JSON.parse(storedCart));
    
    // Get user info
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    if (currentUser?.address) {
      setDeliveryAddress(currentUser.address);
    }
  }, [navigate]);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!deliveryAddress.trim()) {
      toast.error('Please provide a delivery address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const orderData = {
        restaurant_id: cartData.restaurantId,
        items: cartData.items.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: cartData.total,
        delivery_address: deliveryAddress,
        notes: notes,
        payment_method: 'COD' // Cash on Delivery
      };
      
      const response = await api.post('/api/customer/orders', orderData);
      
      if (response.data.success) {
        // Clear cart from localStorage
        localStorage.removeItem('foodOrderCart');
        
        // Show success message
        toast.success('Order placed successfully! Check your WhatsApp for order confirmation.');
        
        // Redirect to order confirmation
        navigate(`/orders/${response.data.data.orderId}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cartData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to menu
      </button>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmitOrder}>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={user?.name || ''}
                  disabled
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={user?.phone || ''}
                  disabled
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Delivery Address *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  placeholder="Enter your full delivery address"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Order Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for your order?"
                ></textarea>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              
              <div className="flex items-center p-3 border border-green-200 bg-green-50 rounded-md">
                <CreditCard className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Cash on Delivery</p>
                  <p className="text-sm text-gray-600">Pay when your order arrives</p>
                </div>
                <Check className="w-5 h-5 text-green-600 ml-auto" />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="font-medium text-blue-800 mb-2">📱 Order Updates via WhatsApp</h3>
              <p className="text-blue-700 text-sm">
                You'll receive order confirmation and status updates via WhatsApp on your registered number: {user?.phone}
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="border-b border-gray-200 pb-4 mb-4">
              <p className="font-medium text-gray-900 mb-2">{cartData.restaurantName}</p>
              <div className="space-y-2">
                {cartData.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{cartData.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span>₹0</span>
              </div>
            </div>
            
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{cartData.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
