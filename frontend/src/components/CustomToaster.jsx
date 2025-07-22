import React from 'react';
import { Toaster } from 'react-hot-toast';

const CustomToaster = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Global toast options
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '500px',
        },
        success: {
          duration: 3000,
          style: {
            background: '#22c55e',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#22c55e',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        },
      }}
    />
  );
};

export default CustomToaster;
