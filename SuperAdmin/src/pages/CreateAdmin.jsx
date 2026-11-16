import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { FaBuilding } from 'react-icons/fa';
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
    accessStartTime: '09:00',
    accessEndDate: '',
    accessEndTime: '18:00'
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
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.mobileNumber ||
      !formData.address ||
      !formData.accessStartDate ||
      !formData.accessStartTime ||
      !formData.accessEndDate ||
      !formData.accessEndTime
    ) {
      return 'Please fill in all required fields.';
    }

    if (formData.password.length < 6) {
      return 'Password should be at least 6 characters.';
    }

    const startDateTime = new Date(`${formData.accessStartDate}T${formData.accessStartTime}`);
    const endDateTime = new Date(`${formData.accessEndDate}T${formData.accessEndTime}`);

    if (startDateTime >= endDateTime) {
      return 'Access End Date & Time must be after Start Date & Time.';
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
        throw new Error(data.error || 'Failed to register admin');
      }

      setSuccess('Admin created successfully!');

      setFormData({
        name: '',
        email: '',
        password: '',
        mobileNumber: '',
        address: '',
        accessStartDate: '',
        accessStartTime: '09:00',
        accessEndDate: '',
        accessEndTime: '18:00'
      });

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-form-container">
      <div className="create-form-card">
        {error && (
          <div className="alert-banner error">
            <FiAlertCircle style={{ fontSize: '18px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner success">
            <FiCheckCircle style={{ fontSize: '18px', flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Section 1: Admin Details */}
          <div className="form-section-title">
            <span className="section-title-icon"><FaBuilding /></span>
            <span>Admin Details</span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Hospital / Admin Name <span className="req">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon"><FaBuilding /></span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter hospital / admin name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Email Address <span className="req">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon"><FiMail /></span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  autoComplete="new-email"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">
                Mobile Number <span className="req">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon"><FiPhone /></span>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Address <span className="req">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon"><FiMapPin /></span>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="req">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon"><FiLock /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          </div>

          <div className="form-divider"></div>

          {/* Section 2: Access Duration */}
          <div className="form-section-title">
            <span className="section-title-icon"><FiCalendar /></span>
            <span>Access Duration</span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Access Start Date <span className="req">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon"><FiCalendar /></span>
                <input
                  type="date"
                  name="accessStartDate"
                  value={formData.accessStartDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Access Start Time <span className="req">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon"><FiClock /></span>
                <input
                  type="time"
                  name="accessStartTime"
                  value={formData.accessStartTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Access End Date <span className="req">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon"><FiCalendar /></span>
                <input
                  type="date"
                  name="accessEndDate"
                  value={formData.accessEndDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Access End Time <span className="req">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="input-icon"><FiClock /></span>
                <input
                  type="time"
                  name="accessEndTime"
                  value={formData.accessEndTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions-footer">
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
              {loading ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
