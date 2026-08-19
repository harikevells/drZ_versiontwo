import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiGrid, FiUserPlus, FiCreditCard, FiClock, FiSettings, FiLogOut, FiBell } from 'react-icons/fi';
import { FaShieldAlt, FaPlusSquare } from 'react-icons/fa';

const Layout = ({ onLogout }) => {
  const location = useLocation();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <FaShieldAlt style={{ fontSize: '16px' }} />
          </div>
          <div className="logo-text">
            <span className="logo-title">DrZ SuperAdmin</span>
            <span className="logo-subtitle">Control Panel</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <FiGrid /> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/create-admin" className={location.pathname === '/create-admin' ? 'active' : ''}>
              <FiUserPlus /> Create Admin
            </Link>
          </li>
          <li>
            <Link to="/manage-plans" className={location.pathname === '/manage-plans' ? 'active' : ''}>
              <FiCreditCard /> Subscriptions
            </Link>
          </li>
          <li style={{ marginTop: '2rem' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>
              <FiLogOut /> Logout
            </a>
          </li>
        </ul>

        <div className="secure-card">
          <div className="secure-icon">
            <FaShieldAlt />
          </div>
          <h4>Secure & Reliable</h4>
          <p>Managing your hospitals<br />with ease and security.</p>
        </div>
      </aside>

      <main className="main-content">
        <div className="top-header">
          <div className="header-text">
            {/* Title can be dynamic based on route, but we leave it empty here to match mockup where title is in the page itself, except for the top right profile */}
            <div></div>
          </div>
          <div className="header-profile">
            <div className="notification-bell">
              <FiBell />
              <div className="notification-dot"></div>
            </div>
            <div className="profile-dropdown">
              <div className="avatar">SA</div>
              <span className="profile-name">Super Admin ▾</span>
            </div>
          </div>
        </div>
        
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
