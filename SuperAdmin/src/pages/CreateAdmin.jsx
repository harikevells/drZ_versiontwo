import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

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
      <div className="page-header">
        <h2>Create Admin</h2>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Admin Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Enter full name"
              />
            </div>
            
            <div className="form-group">
              <label>Admin Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleChange} 
                placeholder="Enter email address"
              />
            </div>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Mobile Number</label>
              <input 
                type="text" 
                name="mobileNumber"
                value={formData.mobileNumber} 
                onChange={handleChange} 
                placeholder="Enter mobile number"
              />
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <input 
                type="text" 
                name="address"
                value={formData.address} 
                onChange={handleChange} 
                placeholder="Enter complete address"
              />
            </div>
          </div>
          
          <div className="form-group" style={{ maxWidth: 'calc(50% - 0.75rem)' }}>
            <label>Admin Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password} 
              onChange={handleChange} 
              placeholder="Create a password"
            />
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.1rem' }}>Access Duration</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Access Start Date</label>
              <input 
                type="date" 
                name="accessStartDate"
                value={formData.accessStartDate} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="form-group">
              <label>Access Start Time</label>
              <input 
                type="time" 
                name="accessStartTime"
                value={formData.accessStartTime} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="form-group">
              <label>Access End Date</label>
              <input 
                type="date" 
                name="accessEndDate"
                value={formData.accessEndDate} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="form-group">
              <label>Access End Time</label>
              <input 
                type="time" 
                name="accessEndTime"
                value={formData.accessEndTime} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <button 
              type="button" 
              style={{ marginRight: '1rem', background: 'transparent', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: 'auto' }}
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
