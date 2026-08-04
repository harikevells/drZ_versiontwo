import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaUserMd, FaCalendarCheck, FaBell, FaSignOutAlt, FaUserInjured, FaThLarge, FaSearch, FaCalendarAlt, FaCog, FaMoon } from 'react-icons/fa';
import './Layout.css';
import logoImage from '../assets/Adminlogo.svg';
import adminImage from '../assets/adminimage.png';

const Layout = () => {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('loginTimestamp');
    navigate('/login');
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

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
      const res = await axios.get(`${API_BASE_URL}/notifications/admin/admin`);
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

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ marginBottom: '0px', padding: '10px 20px 10px 20px', display: 'flex', justifyContent: 'center' }}>
          <img src={logoImage} alt="DrZ Logo" style={{ height: '80px',marginLeft:'-20px' }} />
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaThLarge className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/doctors" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaUserMd className="nav-icon" />
            <span>DR Management</span>
          </NavLink>
          <NavLink to="/schedule" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaCalendarCheck className="nav-icon" />
            <span>Schedule</span>
          </NavLink>
          <NavLink to="/patient" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaUserInjured className="nav-icon" />
            <span>Appointment</span>
          </NavLink>
          <NavLink to="/medical-camp" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaBell className="nav-icon" />
            <span>Push Notification</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-left">
            <p className="greeting-text">{greeting} <span className="wave-emoji">👋</span></p>
            <h2 className="welcome-text">Welcome back, Administrator</h2>
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

            <div className="profile-container">
              <img 
                src={adminImage} 
                alt="Admin Avatar" 
                className="profile-avatar"
              />
              <span className="online-indicator"></span>
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
              <button style={{width:'150px', borderRadius:'20px'}} className="cancel-btn" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button style={{width:'150px', borderRadius:'20px'}} className="confirm-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
