import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Store, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    owner_id: '',
    phone: '',
    address: '',
    is_active: true
  });

  useEffect(() => {
    fetchRestaurants();
    fetchRestaurantOwners();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/api/admin/restaurants');
      if (response.data.success) {
        setRestaurants(response.data.data.restaurants);
      }
    } catch (error) {
      toast.error('Failed to load restaurants');
      console.error('Restaurants error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantOwners = async () => {
    try {
      const response = await api.get('/api/admin/users', { params: { role: 'restaurant_owner' } });
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      console.error('Failed to load restaurant owners:', error);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.owner_id) {
      toast.error('Name and owner are required');
      return;
    }

    try {
      const response = editingRestaurant 
        ? await api.put(`/admin/restaurants/${editingRestaurant.id}`, formData)
        : await api.post('/api/admin/restaurants', formData);
      
      if (response.data.success) {
        toast.success(`Restaurant ${editingRestaurant ? 'updated' : 'created'} successfully`);
        setShowForm(false);
        setEditingRestaurant(null);
        setFormData({ name: '', owner_id: '', phone: '', address: '', is_active: true });
        fetchRestaurants();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editingRestaurant ? 'update' : 'create'} restaurant`);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) {
      return;
    }

    try {
      const response = await api.delete(`/admin/restaurants/${restaurantId}`);
      if (response.data.success) {
        toast.success('Restaurant deleted successfully');
        fetchRestaurants();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete restaurant');
    }
  };

  const getFilteredRestaurants = () => {
    return restaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredRestaurants = getFilteredRestaurants();

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
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Management</h1>
          <p className="text-gray-600">Manage restaurants and their owners</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Restaurant
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Restaurants Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Store className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? "No restaurants match your search criteria."
              : "Get started by adding your first restaurant."}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Restaurant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                  <p className="text-sm text-gray-600">ID: {restaurant.id}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {restaurant.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Owner:</span>
                  <p className="text-sm text-gray-900">{restaurant.owner_name}</p>
                </div>
                {restaurant.phone && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Phone:</span>
                    <p className="text-sm text-gray-900">{restaurant.phone}</p>
                  </div>
                )}
                {restaurant.address && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Address:</span>
                    <p className="text-sm text-gray-900">{restaurant.address}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-700">Created:</span>
                  <p className="text-sm text-gray-900">{new Date(restaurant.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingRestaurant(restaurant);
                    setFormData({
                      name: restaurant.name,
                      owner_id: restaurant.owner_id,
                      phone: restaurant.phone || '',
                      address: restaurant.address || '',
                      is_active: restaurant.is_active
                    });
                    setShowForm(true);
                  }}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRestaurant(restaurant.id)}
                  className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restaurant Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingRestaurant(null);
                  setFormData({ name: '', owner_id: '', phone: '', address: '', is_active: true });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateRestaurant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Enter restaurant name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner *
                </label>
                <select
                  value={formData.owner_id}
                  onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select owner</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Enter restaurant address"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Restaurant is active
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRestaurant(null);
                    setFormData({ name: '', owner_id: '', phone: '', address: '', is_active: true });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  {editingRestaurant ? 'Update' : 'Create'} Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Restaurants;
