import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

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

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Popular</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No subscription plans found</td>
                </tr>
              ) : (
                plans.map(plan => (
                  <tr key={plan.id}>
                    <td style={{ fontWeight: 'bold' }}>{plan.name}</td>
                    <td>{plan.price}</td>
                    <td>{plan.durationValue} {plan.durationType}</td>
                    <td>{plan.isPopular ? '★ Yes' : 'No'}</td>
                    <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => openEditModal(plan)}
                        style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

export default ManagePlans;
