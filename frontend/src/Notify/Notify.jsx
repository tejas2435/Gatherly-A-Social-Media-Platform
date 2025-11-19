import React, { useState, useEffect } from 'react';
import { Bell, Trash2, UserPlus, CheckCircle2, Heart, MessageCircle } from 'lucide-react';
import { useNotification } from '../Header/NotificationContext.jsx';


function Notify() {

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { unreadCount, setUnreadCount, fetchUnreadCount } = useNotification();
  const [markAllToast, setMarkAllToast] = useState(false);


  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/notifications', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();

        // ✅ Ensure notifications is always an array
        if (Array.isArray(data)) {
          setNotifications(data);
        } else if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else {
          setNotifications([]);
        }

      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
      }
    };


    document.title = "Notifications - Gatherly";

    fetchNotifications();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-5 h-5 text-indigo-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const deleteNotification = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setNotifications(notifications.filter(notif => notif.id !== id));
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await fetch('http://localhost:3000/api/notifications', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setNotifications([]);
      setShowDeleteAllDialog(false);
      fetchUnreadCount();
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const getNotificationBackground = (type) => {
    switch (type) {
      case 'follow':
        return 'bg-indigo-50 dark:bg-indigo-600';
      case 'like':
        return 'bg-pink-50 dark:bg-pink-700';
      case 'comment':
        return 'bg-yellow-50 dark:bg-yellow-700';
      default:
        return 'bg-gray-50 dark:bg-gray-800';
    }
  };



  const handleMarkAllAsRead = async () => {
    try {
      await fetch('http://localhost:3000/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // ✅ Reset UI
      setUnreadCount(0);         // Immediate UI update
      fetchUnreadCount();        // Refetch to confirm
      setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })));
      setMarkAllToast(true);
      setTimeout(() => setMarkAllToast(false), 2000);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }


  };


  const fetchNotificationCount = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3000/api/notifications/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setNotificationCount(data.count);
    } catch (err) {
      console.error('Failed to fetch notification count', err);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
  }, []);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg shadow-sm dark:bg-gray-900">
              <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full ">
              {unreadCount} new
            </span>

            <span>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors duration-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Mark All Read</span>
                </button>
              )}
            </span>
            {notifications.length > 0 && (
              <button
                onClick={() => setShowDeleteAllDialog(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Delete All</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden dark:bg-gray-700">
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1 dark:text-white">All caught up!</h3>
                <p className="text-gray-500 dark:text-gray-200">No new notifications to show</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group p-4 sm:p-6 transition-all duration-200 hover:shadow-md ${getNotificationBackground(notification.type)
                    }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        className="h-12 w-12 rounded-full ring-2 ring-white"
                        src={notification.user.avatar}
                        alt={notification.user.name}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {notification.user.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-white">{new Date(notification.time).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}</span>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded-full"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-white">
                        {notification.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete All Confirmation Dialog */}
        {showDeleteAllDialog && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete All Notifications</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete all notifications? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteAllDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAllNotifications}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Toast */}
        {showConfirmation && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 transform bg-gray-800 text-white px-8 py-2 rounded-lg shadow-lg flex items-center space-x-4 z-50 text-lg font-semibold opacity-100 transition-all duration-900 ease-out">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span>Notifications removed</span>
          </div>
        )}

        {markAllToast && (
          <div
            className="fixed top-8 left-1/2 -translate-x-1/2 transform bg-green-600 text-white px-8 py-4 rounded-xl shadow-xl flex items-center space-x-4 z-50 text-lg font-semibold opacity-100 transition-all duration-900 ease-out"
          >
            <CheckCircle2 className="w-6 h-6 text-white" />
            <span>All notifications marked as read</span>
          </div>
        )}



      </div>
    </div>
  );
}

export default Notify;
