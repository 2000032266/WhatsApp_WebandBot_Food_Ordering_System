import { Clock, IndianRupee, CheckCircle, XCircle, CreditCard } from 'lucide-react';

const OrderCard = ({ order, onUpdateStatus, onUpdatePayment, showActions = true }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-200 text-green-900';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const nextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready',
      'ready': 'delivered'
    };
    return statusFlow[currentStatus];
  };

  // Check if order can be marked as delivered (only if payment is confirmed)
  const canMarkAsDelivered = (order) => {
    return order.status === 'ready' && order.payment_status === 'paid';
  };

  // Get the appropriate button text and state
  const getStatusButtonInfo = (order) => {
    const nextStat = nextStatus(order.status);
    if (nextStat === 'delivered' && !canMarkAsDelivered(order)) {
      return {
        text: 'Mark as Delivered (Payment Required)',
        disabled: true,
        className: 'flex items-center px-3 py-2 bg-gray-400 text-white text-sm rounded-md cursor-not-allowed'
      };
    }
    return {
      text: `Mark as ${nextStat}`,
      disabled: false,
      className: 'flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors'
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order #{order.id}
          </h3>
          <p className="text-sm text-gray-600">{order.customer_name}</p>
          <p className="text-sm text-gray-500">{order.customer_phone}</p>
        </div>
        <div className="text-right">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <p className="text-lg font-bold text-gray-900 mt-1">
            ₹{order.total}
          </p>
        </div>
      </div>

      {/* Order Items */}
      {order.items && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">Items:</h4>
          <ul className="space-y-1">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.item_name}</span>
                <span>₹{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          {formatDate(order.created_at)}
        </div>
        <div className="flex items-center">
          <IndianRupee className="w-4 h-4 mr-1" />
          <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
            {order.payment_status}
          </span>
        </div>
      </div>

      {/* Delivery Address */}
      {order.delivery_address && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <strong>Address:</strong> {order.delivery_address}
          </p>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <strong>Notes:</strong> {order.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      {showActions && order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="flex flex-wrap gap-2">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => onUpdateStatus(order.id, 'confirmed')}
                className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Accept
              </button>
              <button
                onClick={() => onUpdateStatus(order.id, 'cancelled')}
                className="flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </button>
            </>
          )}
          
          {nextStatus(order.status) && order.status !== 'pending' && (
            <button
              onClick={() => onUpdateStatus(order.id, nextStatus(order.status))}
              disabled={getStatusButtonInfo(order).disabled}
              className={getStatusButtonInfo(order).className}
            >
              {getStatusButtonInfo(order).text}
            </button>
          )}
          
          {/* Payment Status Actions - Keep payment options available unless order is cancelled */}
          {order.payment_status !== 'paid' && onUpdatePayment && order.status !== 'cancelled' && (
            <button
              onClick={() => onUpdatePayment(order.id, 'paid')}
              className="flex items-center px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Mark as Paid
            </button>
          )}
          
          {order.payment_status === 'paid' && onUpdatePayment && order.status !== 'cancelled' && (
            <button
              onClick={() => onUpdatePayment(order.id, 'refunded')}
              className="flex items-center px-3 py-2 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Refund
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
