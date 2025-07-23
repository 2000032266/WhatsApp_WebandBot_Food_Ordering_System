import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import AuthService from '../services/auth';

/**
 * Hook for real-time notifications using WebSockets
 */
const useRealTimeNotifications = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Get current user for authentication
  const user = AuthService.getCurrentUser();

  // Connect to the WebSocket server
  const connect = useCallback(() => {
    if (!user || !user.id) {
      console.log('No user logged in, not connecting to notification server');
      return;
    }

    // Get the base API URL from the environment or use default
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const wsUrl = baseUrl.replace('http', 'ws').replace('/api', '');
    
    const ws = new WebSocket(`${wsUrl}?userId=${user.id}`);

    ws.onopen = () => {
      console.log('Connected to notification server');
      setConnected(true);
    };

    ws.onclose = () => {
      console.log('Disconnected from notification server');
      setConnected(false);
      
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received notification:', data);
        
        // Add notification to state
        setNotifications(prev => [data, ...prev].slice(0, 20));
        
        // Show toast notification based on type
        switch (data.type) {
          case 'order_status_update':
            toast(
              <div>
                <p className="font-bold">Order #{data.orderId} Update</p>
                <p>{data.message}</p>
              </div>,
              { icon: data.emoji || '🔔' }
            );
            break;
            
          case 'payment_update':
            toast(
              <div>
                <p className="font-bold">Payment Update</p>
                <p>{data.message}</p>
              </div>,
              { icon: data.emoji || '💰' }
            );
            break;
            
          case 'connection':
            // Connection message, no need to show toast
            break;
            
          default:
            // Generic notification
            toast(
              <div>
                <p className="font-bold">{data.title || 'Notification'}</p>
                <p>{data.message}</p>
              </div>,
              { icon: data.emoji || '🔔' }
            );
        }
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    setSocket(ws);

    // Cleanup function
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user]);

  // Connect when the component mounts
  useEffect(() => {
    const wsConnection = connect();
    
    // Cleanup on unmount
    return () => {
      if (wsConnection) {
        wsConnection();
      }
    };
  }, [connect]);

  return {
    connected,
    notifications,
    clearNotifications: () => setNotifications([])
  };
};

export default useRealTimeNotifications;
