import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateAdmin from './pages/CreateAdmin';
import ManagePlans from './pages/ManagePlans';
import Subscription from './pages/Subscription';
import Layout from './components/Layout';
import './index.css';

// 24 hours in milliseconds (24 * 60 * 60 * 1000)
const TWENTY_FOUR_HOURS = 86400000;

function App() {
  // Clear any old legacy persistent localStorage on boot
  useEffect(() => {
    localStorage.removeItem('superadmin_auth');
    localStorage.removeItem('superadmin_remember');
  }, []);

  // Authentication state - strictly SessionStorage based
  // Whenever the tab/browser is closed, sessionStorage is automatically wiped
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const isAuth = sessionStorage.getItem('superadmin_session') === 'true';
    const loginTime = sessionStorage.getItem('superadmin_login_time');

    if (!isAuth || !loginTime) {
      return false;
    }

    const elapsed = Date.now() - parseInt(loginTime, 10);
    // If 24 hours have passed, invalidate session
    if (elapsed >= TWENTY_FOUR_HOURS) {
      sessionStorage.removeItem('superadmin_session');
      sessionStorage.removeItem('superadmin_login_time');
      return false;
    }

    return true;
  });

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('superadmin_session');
    sessionStorage.removeItem('superadmin_login_time');
    localStorage.removeItem('superadmin_auth');
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('superadmin_session', 'true');
    sessionStorage.setItem('superadmin_login_time', Date.now().toString());
  };

  // 24 Hours Auto Logout logic (while browser tab remains open)
  useEffect(() => {
    if (!isAuthenticated) return;

    const loginTime = sessionStorage.getItem('superadmin_login_time');
    if (!loginTime) return;

    const elapsed = Date.now() - parseInt(loginTime, 10);
    const remainingTime = TWENTY_FOUR_HOURS - elapsed;

    if (remainingTime <= 0) {
      handleLogout();
      return;
    }

    // Set timeout to auto logout when 24 hours expire
    const timer = setTimeout(() => {
      handleLogout();
    }, remainingTime);

    // Periodic safety check every 1 minute
    const interval = setInterval(() => {
      const currentElapsed = Date.now() - parseInt(loginTime, 10);
      if (currentElapsed >= TWENTY_FOUR_HOURS) {
        handleLogout();
      }
    }, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isAuthenticated, handleLogout]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login route - always displayed first if not authenticated */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} 
        />
        
        {/* Protected Dashboard routes */}
        <Route element={isAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-admin" element={<CreateAdmin />} />
          <Route path="/manage-plans" element={<ManagePlans />} />
          <Route path="/subscription/:adminId" element={<Subscription />} />
        </Route>

        {/* Fallback route - redirect unauthenticated users to /login */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
