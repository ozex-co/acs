import React from 'react';
import { useNotification, Notification, NotificationType } from '../context/NotificationContext';
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiXCircle, FiX } from 'react-icons/fi'; // Icons
// Use a library like react-transition-group for animations if desired

const typeStyles: Record<NotificationType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-500', 
    border: 'border-green-700',
    text: 'text-white',
    icon: <FiCheckCircle />
  },
  error: {
    bg: 'bg-red-500',
    border: 'border-red-700',
    text: 'text-white',
    icon: <FiXCircle />
  },
  warning: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-700',
    text: 'text-gray-900',
    icon: <FiAlertTriangle />
  },
  info: {
    bg: 'bg-blue-500',
    border: 'border-blue-700',
    text: 'text-white',
    icon: <FiInfo />
  },
};

const NotificationItem: React.FC<{ notification: Notification; onDismiss: (id: number) => void }> = 
  ({ notification, onDismiss }) => {
  const styles = typeStyles[notification.type];

  // Basic fade-in/out simulation with CSS (or use react-transition-group)
  // This requires setup in your global CSS for `animate-toast-in` and `animate-toast-out`
  const [isExiting, setIsExiting] = React.useState(false);

  const handleDismiss = () => {
      setIsExiting(true);
      // Wait for animation before removing from state
      setTimeout(() => onDismiss(notification.id), 300); // Match animation duration
  };

  return (
    <div
      className={`
        ${styles.bg} ${styles.text} ${styles.border} 
        relative flex items-center p-4 mb-3 rounded-md shadow-lg border-l-4 
        transition-all duration-300 ease-in-out 
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3 text-xl">{styles.icon}</div>
      <div className="flex-grow text-sm">{notification.message}</div>
      <button
        onClick={handleDismiss}
        className="ml-4 flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors"
        aria-label="Dismiss"
      >
        <FiX size={16} />
      </button>
    </div>
  );
};

const NotificationsDisplay: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
      {/* Render notifications, typically newest on top */} 
      {notifications.map((notification) => (
        <NotificationItem 
            key={notification.id} 
            notification={notification} 
            onDismiss={removeNotification} 
        />
      ))}
    </div>
  );
};

export default NotificationsDisplay; 