'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  read: boolean;
}

interface NotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onMarkAsRead: (id: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({
  notifications,
  onDismiss,
  onDismissAll,
  onMarkAsRead
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationSound] = useState<HTMLAudioElement | null>(
    typeof Audio !== 'undefined' ? new Audio('/sounds/notification.mp3') : null
  );
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Play sound when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0 && notificationSound) {
      // Only play sound for desktop notifications
      notificationSound.volume = 0.5;
      notificationSound.play().catch(err => console.log('Audio play failed:', err));
    }
  }, [unreadCount, notificationSound]);
  
  // Show browser notifications if allowed
  useEffect(() => {
    const showBrowserNotification = (notification: Notification) => {
      if (!("Notification" in window)) return;
      
      if (Notification.permission === "granted" && document.hidden) {
        new Notification("Tournament Notification", {
          body: notification.message,
          icon: "/icons/bell.svg"
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    };
    
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length > 0) {
      unreadNotifications.forEach(showBrowserNotification);
    }
  }, [notifications]);
  
  return (
    <div className="relative z-50">
      {/* Notification Bell */}
      <div className="fixed bottom-4 right-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1"
            >
              {unreadCount}
            </motion.span>
          )}
        </button>
      </div>
      
      {/* Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 w-80 max-h-96 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
              <h3 className="font-bold text-white">Notifications</h3>
              <div className="space-x-2">
                <button 
                  onClick={onDismissAll} 
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-grow">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notification) => (
                    <motion.div 
                      key={notification.id}
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`p-3 border-b border-gray-700 hover:bg-gray-800/50 ${!notification.read ? 'bg-gray-800/80' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-white mb-1">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                        
                        <div className="flex space-x-1">
                          {!notification.read && (
                            <button 
                              onClick={() => onMarkAsRead(notification.id)}
                              className="text-gray-400 hover:text-blue-400"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          
                          <button 
                            onClick={() => onDismiss(notification.id)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast notifications for newest notification */}
      <AnimatePresence>
        {!isOpen && notifications.length > 0 && !notifications[0].read && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-4 w-72 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4"
          >
            <div className="flex">
              <div className="flex-1">
                <p className="text-sm text-white">{notifications[0].message}</p>
                <p className="text-xs text-gray-400 mt-1">{notifications[0].time}</p>
              </div>
              <button 
                onClick={() => onMarkAsRead(notifications[0].id)}
                className="ml-2 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications; 