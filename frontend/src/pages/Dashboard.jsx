import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
  TrendingUp,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import AnimatedCard from '../components/AnimatedCard';
import { Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await api.get('/restaurant/dashboard');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data', {
        id: 'dashboard-error',
        duration: 4000,
      });
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }


  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Support both { stats: {...} } and flat stats object
  const statsData = stats.stats ? stats.stats : stats;

  // Defensive: If statsData is missing, show no data
  if (!statsData || typeof statsData !== 'object') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const orderStatusData = [
    { name: 'Pending', value: statsData.pending_orders || 0, color: '#fbbf24' },
    { name: 'Confirmed', value: statsData.confirmed_orders || 0, color: '#3b82f6' },
    { name: 'Ready', value: statsData.ready_orders || 0, color: '#a855f7' },
    { name: 'Delivered', value: statsData.delivered_orders || 0, color: '#10b981' },
    { name: 'Cancelled', value: statsData.cancelled_orders || 0, color: '#ef4444' },
  ];

  const salesData = [
    { name: 'Today', sales: statsData.today?.total_revenue || 0 },
    { name: 'This Week', sales: statsData.total_revenue || 0 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header with animation */}
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
          Restaurant Dashboard
        </Typography>
        <Typography color="text.secondary" mb={2}>
          Welcome back! Here's what's happening with your restaurant.
        </Typography>
      </motion.div>

      {/* Stats Cards with animation */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <AnimatedCard delay={0.05}>
          <Box display="flex" alignItems="center">
            <Box sx={{ p: 1.5, bgcolor: 'primary.main', borderRadius: 2, display: 'flex' }}>
              <ShoppingBag className="w-6 h-6 text-white" />
            </Box>
            <Box ml={2}>
              <Typography variant="body2" color="text.secondary">Total Orders</Typography>
              <Typography variant="h5" fontWeight={700}>{statsData.total_orders}</Typography>
            </Box>
          </Box>
        </AnimatedCard>
        <AnimatedCard delay={0.15}>
          <Box display="flex" alignItems="center">
            <Box sx={{ p: 1.5, bgcolor: 'success.main', borderRadius: 2, display: 'flex' }}>
              <IndianRupee className="w-6 h-6 text-white" />
            </Box>
            <Box ml={2}>
              <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
              <Typography variant="h5" fontWeight={700}>₹{statsData.total_revenue}</Typography>
            </Box>
          </Box>
        </AnimatedCard>
        <AnimatedCard delay={0.25}>
          <Box display="flex" alignItems="center">
            <Box sx={{ p: 1.5, bgcolor: 'warning.main', borderRadius: 2, display: 'flex' }}>
              <Clock className="w-6 h-6 text-white" />
            </Box>
            <Box ml={2}>
              <Typography variant="body2" color="text.secondary">Pending Orders</Typography>
              <Typography variant="h5" fontWeight={700}>{statsData.pending_orders}</Typography>
            </Box>
          </Box>
        </AnimatedCard>
        <AnimatedCard delay={0.35}>
          <Box display="flex" alignItems="center">
            <Box sx={{ p: 1.5, bgcolor: 'secondary.main', borderRadius: 2, display: 'flex' }}>
              <TrendingUp className="w-6 h-6 text-white" />
            </Box>
            <Box ml={2}>
              <Typography variant="body2" color="text.secondary">Today's Revenue</Typography>
              <Typography variant="h5" fontWeight={700}>₹{statsData.today?.total_revenue || 0}</Typography>
            </Box>
          </Box>
        </AnimatedCard>
      </Box>

      {/* Charts with animation */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 4 }}>
        <AnimatedCard delay={0.1}>
          <Typography variant="h6" fontWeight={600} mb={2}>Sales Overview</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
              <Bar dataKey="sales" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </AnimatedCard>
        <AnimatedCard delay={0.2}>
          <Typography variant="h6" fontWeight={600} mb={2}>Order Status</Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: { lg: 'center' }, gap: 3, justifyContent: 'space-between' }}>
            <Box sx={{ width: { xs: '100%', lg: '55%' }, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width={250} height={250}>
                <PieChart margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={({ name, value }) =>
                      value > 0 ? `${value}` : null
                    }
                    isAnimationActive={true}
                    animationDuration={900}
                    paddingAngle={2}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} orders`, name]}
                    contentStyle={{ borderRadius: 8, fontSize: 14 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            {/* Custom Legend */}
            <Box sx={{ width: { xs: '100%', lg: '40%' }, display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center' }}>
              {orderStatusData.map((entry) => (
                <Box key={entry.name} display="flex" alignItems="center" gap={1}>
                  <span style={{ backgroundColor: entry.color, width: 16, height: 16, borderRadius: '50%', display: 'inline-block', border: '2px solid #fff', boxShadow: '0 1px 2px #ccc' }}></span>
                  <Typography fontWeight={500} color="text.secondary" fontSize={15}>{entry.name}</Typography>
                  <Typography ml={1} color="text.disabled" fontWeight={500}>{entry.value}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </AnimatedCard>
      </Box>

      {/* Best Sellers */}
      {stats.bestSellers && stats.bestSellers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Selling Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.bestSellers.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.total_sold} units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.orders_count} orders
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restaurant Info */}
      {stats.restaurant && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Restaurant Name</p>
              <p className="text-lg text-gray-900">{stats.restaurant.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Owner</p>
              <p className="text-lg text-gray-900">{stats.restaurant.owner_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Phone</p>
              <p className="text-lg text-gray-900">{stats.restaurant.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                stats.restaurant && stats.restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {stats.restaurant && stats.restaurant.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default Dashboard;
