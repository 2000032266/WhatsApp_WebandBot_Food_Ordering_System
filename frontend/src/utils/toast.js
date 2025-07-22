import toast from 'react-hot-toast';

// Custom toast wrapper with enhanced dismiss functionality
const customToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 3000,
      dismissible: true,
      ...options,
      style: {
        background: '#22c55e',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        maxWidth: '500px',
        paddingRight: '40px',
        ...options.style,
      },
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      dismissible: true,
      ...options,
      style: {
        background: '#ef4444',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        maxWidth: '500px',
        paddingRight: '40px',
        ...options.style,
      },
    });
  },

  info: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      dismissible: true,
      ...options,
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        maxWidth: '500px',
        paddingRight: '40px',
        ...options.style,
      },
    });
  },

  warning: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      dismissible: true,
      ...options,
      style: {
        background: '#f59e0b',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
        maxWidth: '500px',
        paddingRight: '40px',
        ...options.style,
      },
    });
  },

  // Custom toast with explicit close button
  custom: (message, type = 'info', options = {}) => {
    const colors = {
      success: '#22c55e',
      error: '#ef4444',
      info: '#3b82f6',
      warning: '#f59e0b',
    };

    return toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        style={{ backgroundColor: colors[type] || colors.info }}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-white hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white"
          >
            ×
          </button>
        </div>
      </div>
    ), {
      duration: options.duration || 4000,
      ...options,
    });
  },

  // Method to dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },

  // Method to dismiss specific toast
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
};

export default customToast;
