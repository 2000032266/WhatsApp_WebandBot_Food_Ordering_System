import { useState, useEffect } from 'react';
import { Filter, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import OrderCard from '../components/OrderCard';
import AuthService from '../services/auth';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'super_admin' ? '/admin/orders' : '/restaurant/orders';
      const params = filter !== 'all' ? { status: filter } : {};
      
      const response = await api.get(endpoint, { params });
      if (response.data.success) {
        let orders = response.data.data.orders || [];
        // Ensure every order has an 'items' property (empty array if missing)
        orders = orders.map(order => ({ ...order, items: Array.isArray(order.items) ? order.items : [] }));
        console.log('Fetched orders:', orders);
        setOrders(orders);
      }
    } catch (error) {
      toast.error('Failed to load orders');
      console.error('Orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
    toast.success('Orders refreshed');
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const endpoint = user?.role === 'super_admin' 
        ? `/admin/orders/${orderId}/status` 
        : `/restaurant/orders/${orderId}/status`;
      
      const response = await api.put(endpoint, { status: newStatus });
      
      if (response.data.success) {
        toast.success(`Order ${newStatus} successfully`);
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      toast.error('Failed to update order status');
      console.error('Update status error:', error);
    }
  };

  const handleUpdatePayment = async (orderId, newPaymentStatus) => {
    try {
      const endpoint = user?.role === 'super_admin' 
        ? `/admin/orders/${orderId}/payment` 
        : `/restaurant/orders/${orderId}/payment`;
      
      const response = await api.put(endpoint, { paymentStatus: newPaymentStatus });
      
      if (response.data.success) {
        toast.success(`Payment status updated to ${newPaymentStatus}`);
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      toast.error('Failed to update payment status');
      console.error('Update payment error:', error);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      // Show loading state
      const originalText = 'Download CSV';
      const button = event.target.closest('button');
      if (button) {
        button.innerHTML = `<svg class="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle><path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Preparing Download...`;
        button.disabled = true;
      }

      const params = {
        status: filter !== 'all' ? filter : undefined,
        dateFrom: undefined, // You can add date filters later
        dateTo: undefined
      };
      
      const response = await api.get('/api/restaurant/orders/download/csv', { 
        params,
        responseType: 'blob', // Important for file download
        timeout: 30000 // 30 second timeout for large files
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate descriptive filename
      const statusText = filter === 'all' ? 'all' : filter;
      const dateText = new Date().toISOString().split('T')[0];
      link.download = `restaurant_orders_${statusText}_${dateText}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Orders exported successfully! (${filteredOrders.length} orders)`);
      
      // Restore button
      if (button) {
        button.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Download CSV`;
        button.disabled = false;
      }
    } catch (error) {
      console.error('Download error:', error);
      
      // Restore button
      const button = event.target.closest('button');
      if (button) {
        button.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Download CSV`;
        button.disabled = false;
      }
      
      if (error.response?.status === 404) {
        toast.error('No orders found for export');
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Export timed out. Please try again or contact support.');
      } else {
        toast.error('Failed to export orders. Please try again.');
      }
    }
  };

  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    return orders.filter(order => order.status === filter);
  };

  const filteredOrders = getFilteredOrders();

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
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
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage your restaurant orders</p>
          <div className="mt-2 text-sm text-gray-500">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} 
            {filter !== 'all' && ` with status: ${filter}`}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Download ${filter === 'all' ? 'all' : filter} orders as CSV`}
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
            {filter !== 'all' && (
              <span className="ml-2 px-2 py-1 bg-green-500 text-xs rounded-full">
                {filter}
              </span>
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filter by status:</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Filter className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? "You don't have any orders yet." 
              : `No orders with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
              onUpdatePayment={handleUpdatePayment}
              showActions={user?.role === 'restaurant_owner'}
            />
          ))}
        </div>
      )}

      {/* Order Summary */}
      {orders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{statusCounts.confirmed}</p>
              <p className="text-sm text-gray-600">Confirmed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{statusCounts.delivered}</p>
              <p className="text-sm text-gray-600">Delivered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{statusCounts.cancelled}</p>
              <p className="text-sm text-gray-600">Cancelled</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
