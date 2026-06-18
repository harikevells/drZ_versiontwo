import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FaUserMd, FaCalendarCheck, FaBell, FaSignOutAlt, FaUserInjured } from 'react-icons/fa';
import './Layout.css';
import logoImage from '../assets/logo.png';

const Layout = () => {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ marginBottom: '5px', padding: '20px 20px 0 20px', display: 'flex', justifyContent: 'center' }}>
          <img src={logoImage} alt="DrZ Logo" style={{ height: '80px' }} />
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaUserMd className="nav-icon" />
            <span>DR Management</span>
          </NavLink>
          <NavLink to="/schedule" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaCalendarCheck className="nav-icon" />
            <span>Schedule</span>
          </NavLink>
          <NavLink to="/patient" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaUserInjured className="nav-icon" />
            <span>Patient</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-welcome">
            <h2>Welcome, Johnny.</h2>
            <p>Super admin For DrZ...</p>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn">
              <FaBell />
            </button>
            <button className="icon-btn" onClick={() => setIsLogoutModalOpen(true)}>
              <FaSignOutAlt />
            </button>
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
              <button className="cancel-btn" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button className="confirm-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
