import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiGrid, FiUserPlus, FiCreditCard, FiLogOut, FiChevronRight } from 'react-icons/fi';
import adminLogo from '../assets/Adminlogo.svg';

const Layout = ({ onLogout }) => {
  const location = useLocation();

  // Determine current page title & breadcrumb based on route
  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/') {
      return { title: 'Dashboard Overview', breadcrumb: 'Dashboard', desc: 'Monitor your hospitals and system admins' };
    }
    if (path === '/create-admin') {
      return { title: 'Create Admin', breadcrumb: 'Create Admin', desc: 'Provision access credentials for a hospital' };
    }
    if (path === '/manage-plans') {
      return { title: 'Subscription Management', breadcrumb: 'Subscriptions', desc: 'Manage plans and active hospital subscriptions' };
    }
    if (path.startsWith('/subscription/')) {
      return { title: 'Hospital Subscription', breadcrumb: 'Subscription Details', desc: 'View and update plan duration' };
    }
    return { title: 'Super Admin Panel', breadcrumb: 'Home', desc: 'DrZ Hospital Control Center' };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={adminLogo} alt="DrZ SuperAdmin Logo" className="sidebar-brand-logo" />
        </div>

        <ul className="sidebar-menu">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <FiGrid /> <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/create-admin" className={location.pathname === '/create-admin' ? 'active' : ''}>
              <FiUserPlus /> <span>Create Admin</span>
            </Link>
          </li>
          <li>
            <Link to="/manage-plans" className={location.pathname === '/manage-plans' ? 'active' : ''}>
              <FiCreditCard /> <span>Subscriptions</span>
            </Link>
          </li>
          <li className="sidebar-logout-item">
            <button 
              type="button" 
              className="sidebar-logout-btn" 
              onClick={onLogout}
              title="Logout from session"
            >
              <FiLogOut /> <span>Logout</span>
            </button>
          </li>
        </ul>

        <div className="secure-card">
          <div className="secure-badge">
            <span className="secure-pulse"></span>
            <span>Live Security</span>
          </div>
          <h4>Dr.Z Control Engine</h4>
          <p>Managing hospitals with 256-bit encryption & real-time monitoring.</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header UI */}
        <header className="top-header">
          <div className="header-left">
            <h1 className="header-title">{pageInfo.title}</h1>
          </div>

          <div className="header-right">
            {/* System Status Pill */}
            {/* <div className="header-status-pill">
              <span className="status-indicator-dot"></span>
              <span>System Online</span>
            </div> */}

            {/* User Profile Card */}
            <div className="header-profile-card">
              <div className="header-avatar">SA</div>
              <div className="header-profile-info">
                <span className="header-user-name">Super Admin</span>
                <span className="header-user-role">Primary Owner</span>
              </div>
              <button 
                type="button" 
                className="header-logout-quick"
                onClick={onLogout}
                title="Quick Logout"
              >
                <FiLogOut />
              </button>
            </div>
          </div>
        </header>
        
        {/* Uniform Content Wrapper */}
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
