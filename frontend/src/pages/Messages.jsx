import { useState, useEffect } from 'react';
import { MessageSquare, Filter, Search, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    phone: '',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    limit: 100
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [filters]);

  const fetchMessages = async () => {
    try {
      const params = {};
      if (filters.phone) params.phone = filters.phone;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.limit) params.limit = filters.limit;

      const response = await api.get('/api/admin/messages', { params });
      if (response.data.success) {
        setMessages(response.data.data.messages);
      }
    } catch (error) {
      toast.error('Failed to load messages');
      console.error('Messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMessages = () => {
    return messages.filter(message => {
      const matchesSearch = message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          message.phone.includes(searchTerm) ||
                          (message.user_name && message.user_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  };

  const filteredMessages = getFilteredMessages();

  const messageTypes = [
    { value: 'all', label: 'All Messages' },
    { value: 'incoming', label: 'Incoming' },
    { value: 'outgoing', label: 'Outgoing' },
    { value: 'button_reply', label: 'Button Replies' }
  ];

  const getMessageTypeColor = (type) => {
    switch (type) {
      case 'incoming':
        return 'bg-blue-100 text-blue-800';
      case 'outgoing':
        return 'bg-green-100 text-green-800';
      case 'button_reply':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
          <h1 className="text-3xl font-bold text-gray-900">Message Logs</h1>
          <p className="text-gray-600">WhatsApp conversation logs and analytics</p>
        </div>
        <button
          onClick={fetchMessages}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Phone Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={filters.phone}
              onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Filter by phone"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {messageTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
          <p className="text-gray-500">
            {searchTerm || Object.values(filters).some(f => f && f !== 'all')
              ? "No messages match your search criteria."
              : "No messages in the system yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Messages ({filteredMessages.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredMessages.map((message) => (
              <div key={message.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {message.user_name || 'Unknown User'}
                        </p>
                        <span className="text-sm text-gray-500">
                          {message.phone}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMessageTypeColor(message.type)}`}>
                          {message.type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 break-words">
                        {message.message}
                      </p>
                      
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(message.created_at)}
                        {message.message_sid && (
                          <span className="ml-3">
                            SID: {message.message_sid}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Statistics */}
      {messages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Incoming</p>
                <p className="text-2xl font-bold text-gray-900">
                  {messages.filter(m => m.type === 'incoming').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outgoing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {messages.filter(m => m.type === 'outgoing').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(messages.map(m => m.phone)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
