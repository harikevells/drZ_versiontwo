import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateAdmin from './pages/CreateAdmin';
import ManagePlans from './pages/ManagePlans';
import Subscription from './pages/Subscription';
import Layout from './components/Layout';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('superadmin_auth') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('superadmin_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('superadmin_auth');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        
        <Route element={isAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-admin" element={<CreateAdmin />} />
          <Route path="/manage-plans" element={<ManagePlans />} />
          <Route path="/subscription/:adminId" element={<Subscription />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
