import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiUsers, FiUserPlus, FiLogOut } from 'react-icons/fi';

const Layout = ({ onLogout }) => {
  const location = useLocation();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">DrZ SuperAdmin</div>
        <ul className="sidebar-menu">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <FiUsers /> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/create-admin" className={location.pathname === '/create-admin' ? 'active' : ''}>
              <FiUserPlus /> Create Admin
            </Link>
          </li>
          <li style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>
              <FiLogOut /> Logout
            </a>
          </li>
        </ul>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
