import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaCrown, FaPaperPlane, FaGem } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';

const ManagePlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: '',
    durationType: 'months',
    durationValue: '1',
    features: '',
    isPopular: false
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('https://drz-versiontwo.onrender.com/api/subscription-plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      
      const planList = data.map(plan => ({
        ...plan,
        id: plan._id
      }));
      
      setPlans(planList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching plans: ", error);
      setLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this subscription plan?")) return;
    try {
      const response = await fetch(`https://drz-versiontwo.onrender.com/api/subscription-plans/${planId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete plan');
      fetchPlans();
    } catch (error) {
      console.error("Error deleting plan: ", error);
      alert("Failed to delete plan");
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      price: '',
      durationType: 'months',
      durationValue: '1',
      features: '',
      isPopular: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setIsEditing(true);
    setFormData({
      id: plan.id,
      name: plan.name || '',
      price: plan.price || '',
      durationType: plan.durationType || 'months',
      durationValue: plan.durationValue || '1',
      features: plan.features ? plan.features.join('\n') : '',
      isPopular: plan.isPopular || false
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Parse features by newline
    const featuresArray = formData.features.split('\n').filter(f => f.trim() !== '');

    const payload = {
      name: formData.name,
      price: formData.price,
      durationType: formData.durationType,
      durationValue: parseInt(formData.durationValue),
      features: featuresArray,
      isPopular: formData.isPopular
    };

    try {
      const url = isEditing 
        ? `https://drz-versiontwo.onrender.com/api/subscription-plans/${formData.id}`
        : `https://drz-versiontwo.onrender.com/api/subscription-plans`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Failed to save plan');
      
      setIsModalOpen(false);
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan: ", error);
      alert("Failed to save plan");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Manage Subscription Plans</h2>
        <button 
          onClick={openCreateModal}
          style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
        >
          <FaPlus style={{ marginRight: '8px' }} /> Create Plan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginTop: '20px' }}>
        {plans.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#6b7280', background: '#fff', borderRadius: '12px' }}>
            No subscription plans found. Click "Create Plan" to get started.
          </div>
        ) : (
          plans.map((plan, index) => {
            const isPopular = plan.isPopular;
            let bgTheme, fgTheme, icon;
            if (isPopular) {
              bgTheme = '#6366f1'; fgTheme = '#fff'; icon = <FaCrown size={28} />;
            } else if (index % 3 === 0) {
              bgTheme = '#f3e8ff'; fgTheme = '#9333ea'; icon = <FaPaperPlane size={24} />;
            } else {
              bgTheme = '#ffedd5'; fgTheme = '#ea580c'; icon = <FaGem size={24} />;
            }

            const dynamicCardStyle = isPopular 
              ? { ...cardStyle, border: `2px solid ${bgTheme}`, transform: 'scale(1.05)', position: 'relative', boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.1)' }
              : cardStyle;

            return (
              <div key={plan._id || plan.id} style={dynamicCardStyle}>
                {isPopular && (
                  <div style={{ position: 'absolute', top: 0, right: '20px', background: bgTheme, color: fgTheme, padding: '6px 16px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    ★ Most Popular
                  </div>
                )}
                
                <div style={iconContainerStyle(isPopular ? bgTheme : bgTheme, isPopular ? fgTheme : fgTheme)}>
                  {icon}
                </div>
                
                <h3 style={planTitleStyle}>{plan.name}</h3>
                
                <div style={priceContainerStyle}>
                  <span style={priceStyle}>{plan.price}</span>
                  <span style={periodStyle}>/ {plan.durationValue} {plan.durationType}</span>
                </div>
                
                <ul style={listStyle}>
                  {(plan.features || []).map((feature, i) => (
                    <li key={i} style={listItemStyle}>
                      <FiCheck color={isPopular ? bgTheme : fgTheme} style={{ marginRight: '10px' }} /> {feature}
                    </li>
                  ))}
                </ul>
                
                <div style={{ display: 'flex', gap: '15px', marginTop: 'auto', width: '100%' }}>
                  <button 
                    onClick={() => openEditModal(plan)}
                    style={{ flex: 1, padding: '10px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                  >
                    <FaEdit style={{ marginRight: '5px' }} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(plan.id)}
                    style={{ flex: 1, padding: '10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                  >
                    <FaTrash style={{ marginRight: '5px' }} /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem', color: '#1f2937' }}>
              {isEditing ? 'Edit Plan' : 'Create New Plan'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Plan Name (e.g. Bronze, Professional)</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Price (e.g. ₹999 / Month)</label>
                <input type="text" name="price" value={formData.price} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Duration Value</label>
                  <input type="number" name="durationValue" value={formData.durationValue} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Duration Type</label>
                  <select name="durationType" value={formData.durationType} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Features (One per line)</label>
                <textarea 
                  name="features" 
                  value={formData.features} 
                  onChange={handleChange} 
                  rows="5"
                  placeholder="Up to 3 Doctors&#10;Up to 500 Patients&#10;Basic Support"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', resize: 'vertical' }} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '25px', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" id="isPopular" name="isPopular" checked={formData.isPopular} onChange={handleChange} style={{ marginRight: '10px', width: '18px', height: '18px' }} />
                <label htmlFor="isPopular" style={{ fontSize: '14px', color: '#4b5563', cursor: 'pointer' }}>Highlight as "Most Popular" Plan</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{isEditing ? 'Update Plan' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable inline styles for the Subscription cards
const cardStyle = {
  background: '#fff',
  borderRadius: '16px',
  padding: '40px 30px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  border: '1px solid #f3f4f6',
  transition: 'transform 0.3s ease',
};

const iconContainerStyle = (bg, color) => ({
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: bg,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
});

const planTitleStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: '15px',
};

const priceContainerStyle = {
  marginBottom: '30px',
  display: 'flex',
  alignItems: 'baseline',
};

const priceStyle = {
  fontSize: '36px',
  fontWeight: '800',
  color: '#111827',
};

const periodStyle = {
  fontSize: '16px',
  color: '#6b7280',
  marginLeft: '5px',
};

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: '0 0 40px 0',
  width: '100%',
};

const listItemStyle = {
  display: 'flex',
  alignItems: 'center',
  color: '#4b5563',
  marginBottom: '15px',
  fontSize: '15px',
};

export default ManagePlans;
