import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiEye, FiEyeOff, FiCalendar, FiClock } from 'react-icons/fi';
import config from '../config';
import './Createadmin.css';

const CreateAdmin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobileNumber: '',
    address: '',
    accessStartDate: '',
    accessStartTime: '',
    accessEndDate: '',
    accessEndTime: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || 
        !formData.mobileNumber || !formData.address ||
        !formData.accessStartDate || !formData.accessStartTime || 
        !formData.accessEndDate || !formData.accessEndTime) {
      return "All fields are required.";
    }
    
    if (formData.password.length < 6) {
      return "Password should be at least 6 characters.";
    }

    const startDateTime = new Date(`${formData.accessStartDate}T${formData.accessStartTime}`);
    const endDateTime = new Date(`${formData.accessEndDate}T${formData.accessEndTime}`);

    if (startDateTime >= endDateTime) {
      return "Access End Date and Time must be after Start Date and Time.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register admin in backend');
      }

      setSuccess('Admin registered successfully!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        mobileNumber: '',
        address: '',
        accessStartDate: '',
        accessStartTime: '',
        accessEndDate: '',
        accessEndTime: ''
      });
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '0' }}>
        <h2 style={{ marginBottom: '8px' }}>Create Admin</h2>
      </div>
      <div className="page-breadcrumb">
        <Link to="/">Dashboard</Link> &gt; <span>Create Admin</span>
      </div>

      <div className="create-admin-card">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Section 1: Admin Details */}
          <div className="section-header">
            <div className="section-icon-large">
              <FiUser />
            </div>
            <div className="section-title">
              <h3>Admin Details</h3>
              <p>Enter the basic information of the admin.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Admin Name</label>
              <div className="input-wrapper">
                <div className="input-icon-box">
                  <FiUser />
                </div>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Enter full name"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Admin Email</label>
              <div className="input-wrapper">
                <div className="input-icon-box">
                  <FiMail />
                </div>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="Enter email address"
                  autoComplete="new-email"
                />
              </div>
            </div>
          </div>
          
          <div className="form-grid-3">
            <div className="form-group">
              <label>Mobile Number</label>
              <div className="input-wrapper">
                <div className="input-icon-box">
                  <FiPhone />
                </div>
                <input 
                  type="text" 
                  name="mobileNumber"
                  value={formData.mobileNumber} 
                  onChange={handleChange} 
                  placeholder="Enter mobile number"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <div className="input-wrapper">
                <div className="input-icon-box">
                  <FiMapPin />
                </div>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address} 
                  onChange={handleChange} 
                  placeholder="Enter complete address"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Admin Password</label>
              <div className="input-wrapper">
                <div className="input-icon-box">
                  <FiLock />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
                <div 
                  className="toggle-password" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEye /> : <FiEyeOff />}
                </div>
              </div>
            </div>
          </div>

          <div className="divider-dashed"></div>

          {/* Section 2: Access Duration */}
          <div className="section-header">
            <div className="section-icon-large">
              <FiCalendar />
            </div>
            <div className="section-title">
              <h3>Access Duration</h3>
              <p>Set the access start and end date & time.</p>
            </div>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Access Start Date</label>
              <div className="input-wrapper">
                <div className="input-icon-box">
                  <FiCalendar />
                </div>
                <input 
                  type="date" 
                  name="accessStartDate"
                  value={formData.accessStartDate} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Access Start Time</label>
              <div className="input-wrapper">
                <div className="input-icon-box">
                  <FiClock />
                </div>
                <input 
                  type="time" 
                  name="accessStartTime"
                  value={formData.accessStartTime} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Access End Date</label>
              <div className="input-wrapper">
                <div className="input-icon-box">
                  <FiCalendar />
                </div>
                <input 
                  type="date" 
                  name="accessEndDate"
                  value={formData.accessEndDate} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Access End Time</label>
              <div className="input-wrapper">
                <div className="input-icon-box">
                  <FiClock />
                </div>
                <input 
                  type="time" 
                  name="accessEndTime"
                  value={formData.accessEndTime} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Register Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
