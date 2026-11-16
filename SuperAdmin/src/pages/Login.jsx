import { useState } from 'react';
import { FiEye, FiEyeOff, FiAlertCircle, FiCheck } from 'react-icons/fi';
import adminLogo from '../assets/Adminlogo.svg';
import superadminImg from '../assets/superadmin.png';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('superadmin@drz.com');
  const [password, setPassword] = useState('Superadmin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const trimmedUser = username.trim().toLowerCase();

    // Check credentials
    if (
      (trimmedUser === 'superadmin@drz.com' || trimmedUser === 'superadmin' || trimmedUser === 'admin') &&
      (password === 'Superadmin@123' || password === 'admin')
    ) {
      onLogin();
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setInfoMessage('Password reset link sent to admin email.');
    setTimeout(() => setInfoMessage(''), 3500);
  };

  return (
    <div className="spike-login-container">
      {/* Left side: 3D Illustration */}
      <div className="spike-login-left">
        <div className="spike-illustration-wrapper">
          <img 
            src={superadminImg} 
            alt="Super Admin Character Illustration" 
            className="spike-illustration-img"
          />
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="spike-login-right">
        <div className="spike-login-box">
          {/* Logo placed directly above Welcome to Super Admin */}
          <div className="spike-login-logo">
            <img src={adminLogo} alt="DrZ Logo" className="spike-admin-logo" />
          </div>

          <div className="spike-login-header">
            <h1>Welcome to Super Admin</h1>
            <p>Your Admin Dashboard</p>
          </div>

          {/* Error / Notification Alert */}
          {error && (
            <div className="spike-error-alert" role="alert">
              <FiAlertCircle className="spike-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="spike-info-alert" role="status">
              <FiCheck className="spike-alert-icon" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="spike-form">
            <div className="spike-form-group">
              <label htmlFor="username">Username</label>
              <div className="spike-input-wrapper">
                <input
                  id="username"
                  type="text"
                  className="spike-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username or email"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="spike-form-group">
              <label htmlFor="password">Password</label>
              <div className="spike-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="spike-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="spike-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="spike-form-options">
              <label className="spike-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                />
                <span>Remember this Device</span>
              </label>

              <button 
                type="button" 
                className="spike-forgot-link"
                onClick={handleForgotPassword}
              >
                Forgot Password ?
              </button>
            </div>

            {/* Submit Button */}
            <button type="submit" className="spike-submit-btn">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
