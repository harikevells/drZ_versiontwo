import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { formatDistanceToNow, format } from 'date-fns';
import { FaRegBell, FaCheck, FaRegCalendarCheck, FaShieldAlt, FaRegCalendarPlus, FaRegCalendarTimes, FaCalendarAlt, FaClock, FaRegCommentDots } from 'react-icons/fa';
import { FiFilter } from 'react-icons/fi';
import './Notification.css';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Notifications');

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/admin/admin`);
      // Sort by newest first just in case
      const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(sorted);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) => {
          const itemId = notif.id || notif._id;
          return itemId === id ? { ...notif, isRead: true } : notif;
        })
      );
      
      const updatedNotifs = notifications.map((notif) => {
        const itemId = notif.id || notif._id;
        return itemId === id ? { ...notif, isRead: true } : notif;
      });
      const newCount = updatedNotifs.filter(n => !n.isRead).length;
      window.dispatchEvent(new CustomEvent('notification-updated', { detail: { unreadCount: newCount } }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter((notif) => {
        const isRead = notif.isRead === true || notif.isRead === 1 || notif.isRead === 'true';
        return !isRead;
      });

      if(unreadNotifs.length === 0) return;

      await Promise.all(
        unreadNotifs.map((notif) => {
          const itemId = notif.id || notif._id;
          return axios.put(`${API_BASE_URL}/notifications/${itemId}/read`);
        })
      );

      try {
        await axios.put(`${API_BASE_URL}/notifications/readAll/admin/admin`);
      } catch (err) {
        console.warn('Bulk readAll fallback warning:', err);
      }

      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      window.dispatchEvent(new CustomEvent('notification-updated', { detail: { unreadCount: 0 } }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getStyleForTitle = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('completed')) return { color: '#00b894', bg: '#e8f8f5', icon: <FaRegCalendarCheck /> };
    if (t.includes('approved')) return { color: '#0984e3', bg: '#e8f4fd', icon: <FaShieldAlt /> };
    if (t.includes('cancelled')) return { color: '#e84393', bg: '#fdecf3', icon: <FaRegCalendarTimes /> };
    if (t.includes('rescheduled')) return { color: '#fdcb6e', bg: '#fff9e6', icon: <FaCalendarAlt /> };
    if (t.includes('follow')) return { color: '#d35400', bg: '#fdf2e9', icon: <FaRegCommentDots /> };
    if (t.includes('remind') || t.includes('remaind')) return { color: '#16a085', bg: '#e8f6f3', icon: <FaClock /> };
    return { color: '#6c5ce7', bg: '#f0e6ff', icon: <FaRegCalendarPlus /> };
  };

  if (loading) {
    return <div className="notifications-loading">Loading notifications...</div>;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notifications-container">
      {/* Header Section */}
      <div className="notifications-header-section">
        <div className="notifications-header-left">
          <div className="notifications-title-row">
            <div className="bell-icon-wrapper">
              <FaRegBell className="bell-icon" />
            </div>
            <h2>Notifications</h2>
            <span className="count-badge">{unreadCount}</span>
          </div>
          {/* <p className="notifications-subtitle">Stay updated with all important activities and alerts</p> */}
        </div>
        
        <div className="notifications-header-right">
          <button 
            className={`btn-mark-all ${unreadCount === 0 ? 'disabled' : ''}`} 
            onClick={handleMarkAllAsRead} 
            disabled={unreadCount === 0}
          >
            <FaCheck /> Mark All As Read
          </button>
          <div className="filter-dropdown">
            <FiFilter className="filter-icon" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All Notifications">All Notifications</option>
              <option value="New Appointment">New Appointment</option>
              <option value="Approve">Approve</option>
              <option value="Cancel">Cancel</option>
              <option value="Complete">Complete</option>
              <option value="Reschedule">Reschedule</option>
              <option value="Follow up">Follow up</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="notifications-list-wrapper">
        {(() => {
          const filteredNotifications = notifications.filter(notif => {
            if (filter === 'All Notifications') return true;
            const t = (notif.title || '').toLowerCase();
            const f = filter.toLowerCase();
            
            if (f === 'new appointment' && (t.includes('new') || t.includes('booked'))) return true;
            if (f === 'approve' && t.includes('approve')) return true;
            if (f === 'cancel' && t.includes('cancel')) return true;
            if (f === 'complete' && t.includes('complete')) return true;
            if (f === 'reschedule' && t.includes('reschedule')) return true;
            if (f === 'follow up' && t.includes('follow')) return true;
            
            return false;
          });

          if (filteredNotifications.length === 0) {
            return <div className="no-notifications-state">No notifications found for this category</div>;
          }

          return filteredNotifications.map((notif) => {
            const itemId = notif.id || notif._id;
            const isRead = notif.isRead === true || notif.isRead === 1 || notif.isRead === 'true';
            const { color, bg, icon } = getStyleForTitle(notif.title);
            
            let timeAgo = '';
            let formattedDate = '';
            try {
              const d = new Date(notif.createdAt);
              timeAgo = formatDistanceToNow(d, { addSuffix: true });
              // Example: 04/08/2026, 11:52 AM
              formattedDate = format(d, 'dd/MM/yyyy, hh:mm a');
            } catch (e) {
              formattedDate = 'Unknown Date';
            }

            // Adjust timeAgo text (e.g. "about 2 hours ago" -> "2 hours ago")
            timeAgo = timeAgo.replace('about ', '');

            return (
              <div
                key={itemId}
                className="notif-card"
                style={{ borderLeftColor: color }}
                onClick={() => {
                  if (!isRead) handleMarkAsRead(itemId);
                }}
              >
                {/* Left Icon */}
                <div className="notif-icon-box" style={{ backgroundColor: bg, color: color }}>
                  {icon}
                </div>

                {/* Main Content */}
                <div className="notif-body">
                  <h4 className="notif-title">{notif.title}</h4>
                  <p className="notif-desc">{notif.message}</p>
                  <div className="notif-date-row">
                    <span className="date-text">{formattedDate}</span>
                  </div>
                </div>

                {/* Right side indicators */}
                <div className="notif-right-panel">
                  {!isRead && (
                    <span className="notif-new-badge" style={{ color: color, backgroundColor: bg }}>
                      New
                    </span>
                  )}
                  <div className="notif-time-row">
                    <span className="time-ago">{timeAgo}</span>
                    {!isRead && <span className="unread-dot" style={{ backgroundColor: color }}></span>}
                  </div>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};

export default Notification;
