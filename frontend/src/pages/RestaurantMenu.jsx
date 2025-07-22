import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const RestaurantMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const restaurantResponse = await api.get(`/restaurants/${id}`);
      if (restaurantResponse.data.success) {
        setRestaurant(restaurantResponse.data.data.restaurant);
        
        // Fetch menu items
        const menuResponse = await api.get(`/restaurants/${id}/menu`);
        if (menuResponse.data.success) {
          // Group menu items by category
          const menuItems = menuResponse.data.data.menuItems;
          const categories = {};
          
          menuItems.forEach(item => {
            if (!categories[item.category]) {
              categories[item.category] = [];
            }
            categories[item.category].push(item);
          });
          
          setMenuCategories(Object.entries(categories).map(([name, items]) => ({
            name,
            items
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast.error('Failed to load restaurant menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return prevCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 } 
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    
    toast.success(`Added ${item.name} to cart`);
  };

  const removeFromCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity - 1 } 
            : cartItem
        );
      } else {
        return prevCart.filter(cartItem => cartItem.id !== item.id);
      }
    });
  };

  const getItemQuantityInCart = (itemId) => {
    const item = cart.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  };

  const getTotalCartValue = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const proceedToCheckout = () => {
    // Store cart in localStorage for the checkout page
    localStorage.setItem('foodOrderCart', JSON.stringify({
      restaurantId: id,
      restaurantName: restaurant.name,
      items: cart,
      total: getTotalCartValue()
    }));
    
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Restaurant not found</h2>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Back to Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Back button */}
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-blue-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to restaurants
      </button>
      
      {/* Restaurant header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
        <p className="text-gray-600 mt-1">{restaurant.description || 'Delicious food awaits!'}</p>
        {restaurant.address && (
          <p className="text-sm text-gray-500 mt-2">{restaurant.address}</p>
        )}
      </div>

      {/* Menu categories */}
      <div className="space-y-8">
        {menuCategories.map(category => (
          <div key={category.name} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{category.name}</h2>
            <div className="space-y-4">
              {category.items.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">₹{item.price}</p>
                  </div>
                  
                  {getItemQuantityInCart(item.id) > 0 ? (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => removeFromCart(item)}
                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center">{getItemQuantityInCart(item.id)}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="p-1 rounded-full bg-green-500 text-white hover:bg-green-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(item)}
                      className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                    >
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart floating button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 border-t border-gray-200">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{cart.reduce((total, item) => total + item.quantity, 0)} item(s)</p>
              <p className="text-lg font-bold">₹{getTotalCartValue()}</p>
            </div>
            <button 
              onClick={proceedToCheckout}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenu;
