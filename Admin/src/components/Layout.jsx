import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaUserMd, FaCalendarCheck, FaBell, FaSignOutAlt, FaUserInjured, FaThLarge, FaSearch, FaCalendarAlt, FaCog, FaMoon, FaLock, FaFileInvoice } from 'react-icons/fa';
import './Layout.css';
import logoImage from '../assets/Adminlogo.svg';
import adminImage from '../assets/adminimage.png';

const Layout = () => {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('adminId');
    sessionStorage.removeItem('loginTimestamp');
    navigate('/login');
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  // Lock Screen States
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');

  useEffect(() => {
    // Check Admin Live Status
    const checkStatus = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token || token === 'static-admin-token') return;
        
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_BASE_URL}/auth/admin/status`, config);
        
        if (res.data.locked) {
          setIsLocked(true);
          setLockReason(res.data.reason || 'Your access period has expired. Contact your Super Admin.');
        } else {
          setIsLocked(false);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          setIsLocked(true);
          setLockReason('Your session is invalid or expired. Contact your Super Admin.');
        }
      }
    };

    checkStatus(); // Initial check
    const intervalId = setInterval(checkStatus, 2000); // Check every 2 seconds

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const handleUpdate = (e) => {
      if (e.detail && typeof e.detail.unreadCount === 'number') {
        setUnreadCount(e.detail.unreadCount);
      } else {
        fetchUnreadCount();
      }
    };

    window.addEventListener('notification-updated', handleUpdate);
    return () => {
      window.removeEventListener('notification-updated', handleUpdate);
    };
  }, [location.pathname]); // Refresh count when navigation changes

  const fetchUnreadCount = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_BASE_URL}/notifications/admin/admin`, config);
      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  const getFormattedDate = () => {
    const date = new Date();
    const optionsDate = { month: 'short', day: '2-digit', year: 'numeric' };
    const dateString = date.toLocaleDateString('en-US', optionsDate);
    const dayString = date.toLocaleDateString('en-US', { weekday: 'long' });
    return { dateString, dayString };
  };

  const greeting = getGreeting();
  const { dateString, dayString } = getFormattedDate();
  const adminId = sessionStorage.getItem('adminId');

  const getAdminNameFromToken = () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return 'Administrator';
      if (token === 'static-admin-token') return 'Super Admin';
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload && payload.email) {
        const namePart = payload.email.split('@')[0];
        // Add a space before "hospital" or "clinic" if it's concatenated directly
        let spacedName = namePart.replace(/(hospital)/gi, ' $1').replace(/(clinic)/gi, ' $1');
        // Replace special characters with spaces
        let cleanName = spacedName.replace(/[_.+-]/g, ' ').trim();
        // Capitalize words
        cleanName = cleanName.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        return cleanName;
      }
      return 'Administrator';
    } catch (e) {
      return 'Administrator';
    }
  };

  const adminName = getAdminNameFromToken();

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ marginBottom: '0px', padding: '10px 20px 10px 20px', display: 'flex', justifyContent: 'center' }}>
          <img src={logoImage} alt="DrZ Logo" style={{ height: '80px', marginLeft: '-20px' }} />
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <FaThLarge className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/doctors" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <FaUserMd className="nav-icon" />
            <span>DR Management</span>
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <FaCalendarCheck className="nav-icon" />
            <span>Schedule</span>
          </NavLink>
          <NavLink to="/patient" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <FaUserInjured className="nav-icon" />
            <span>Appointment</span>
          </NavLink>
          <NavLink to="/medical-camp" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <FaBell className="nav-icon" />
            <span>Push Notification</span>
          </NavLink>
          <NavLink to="/billing" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <FaFileInvoice className="nav-icon" />
            <span>Billing</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-left">
            <p className="greeting-text">{greeting} <span className="wave-emoji">👋</span></p>
            <h2 className="welcome-text">
              Welcome back, {adminName}
            </h2>
          </div>

          <div className="topbar-right">
            <div className="date-display">
              <div className="calendar-icon-container">
                <FaCalendarAlt />
              </div>
              <div className="date-text">
                <span className="full-date">{dateString}</span>
                <span className="day-name">{dayString}</span>
              </div>
            </div>

            <button className="icon-btn notification-btn" onClick={() => navigate('/notifications')}>
              <FaBell />
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button className="icon-btn" onClick={() => setIsLogoutModalOpen(true)} title="Logout">
              <FaSignOutAlt />
            </button>

            <div className="profile-container" style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={adminImage}
                  alt="Admin Avatar"
                  className="profile-avatar"
                />
                <span className="online-indicator"></span>
              </div>
              <div className="profile-info" style={{ display: 'flex', flexDirection: 'column', marginLeft: '10px' }}>
                <span className="profile-name" style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937', lineHeight: '1.2', textTransform: 'capitalize' }}>
                  {adminName}
                </span>
                {adminId && (
                  <span className="profile-id" style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.2', marginTop: '2px' }}>
                    {adminId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="content-wrapper">
          <Outlet />
        </main>
      </div>

      {isLogoutModalOpen && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-content">
            <img src={logoImage} alt="DrZ Logo" style={{ height: '50px', marginBottom: '20px' }} />
            <p>Are you sure you want to logout?</p>
            <div className="logout-modal-actions">
              <button style={{ width: '150px', borderRadius: '20px' }} className="cancel-btn" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button style={{ width: '150px', borderRadius: '20px' }} className="confirm-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Access Lock Screen Overlay */}
      {isLocked && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <FaLock style={{ color: '#fff', fontSize: '72px', marginBottom: '24px' }} />
          <h2 style={{ color: '#fff', fontSize: '32px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}>Access Locked</h2>
          <p style={{ color: '#e5e7eb', fontSize: '18px', textAlign: 'center', maxWidth: '450px', lineHeight: '1.5', marginBottom: '32px' }}>
            {lockReason}
          </p>
          <button 
            onClick={() => navigate('/subscription')}
            style={{ padding: '12px 32px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            View Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
