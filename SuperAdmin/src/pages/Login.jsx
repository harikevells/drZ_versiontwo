import { useState, useEffect } from 'react';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import adminLogo from '../assets/Adminlogo.svg';
import superadminImg from '../assets/superadmin.png';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Prevent browser autofill from popping saved credentials into inputs
  const [canEditUser, setCanEditUser] = useState(false);
  const [canEditPass, setCanEditPass] = useState(false);

  useEffect(() => {
    setUsername('');
    setPassword('');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim().toLowerCase();

    // Verify authorized Super Admin credentials
    if (
      (trimmedUser === 'superadmin@drz.com' || trimmedUser === 'superadmin' || trimmedUser === 'admin') &&
      (password === 'Superadmin@123' || password === 'admin')
    ) {
      onLogin();
    } else {
      setError('Invalid username or password.');
    }
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
          </div>

          {/* Error Alert */}
          {error && (
            <div className="spike-error-alert" role="alert">
              <FiAlertCircle className="spike-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form with Autofill Protection */}
          <form onSubmit={handleSubmit} className="spike-form" autoComplete="off">
            {/* Decoy hidden inputs to absorb browser password managers */}
            <input 
              type="text" 
              name="fake_user_decoy" 
              tabIndex={-1} 
              autoComplete="off" 
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none', zIndex: -1 }} 
            />
            <input 
              type="password" 
              name="fake_pass_decoy" 
              tabIndex={-1} 
              autoComplete="off" 
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none', zIndex: -1 }} 
            />

            <div className="spike-form-group">
              <label htmlFor="login_email">Username</label>
              <div className="spike-input-wrapper">
                <input
                  id="login_email"
                  name="sa_email_addr"
                  type="email"
                  className="spike-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your mail"
                  required
                  autoComplete="off"
                  readOnly={!canEditUser}
                  onFocus={() => setCanEditUser(true)}
                  onClick={() => setCanEditUser(true)}
                />
              </div>
            </div>

            <div className="spike-form-group">
              <label htmlFor="login_pwd">Password</label>
              <div className="spike-input-wrapper">
                <input
                  id="login_pwd"
                  name="sa_secret_token"
                  type={showPassword ? 'text' : 'password'}
                  className="spike-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="new-password"
                  readOnly={!canEditPass}
                  onFocus={() => setCanEditPass(true)}
                  onClick={() => setCanEditPass(true)}
                />
                <button
                  type="button"
                  className="spike-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="spike-submit-btn" style={{ marginTop: '16px' }}>
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
