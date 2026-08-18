import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheck, FiArrowLeft } from 'react-icons/fi';
import { FaCrown, FaPaperPlane, FaGem } from 'react-icons/fa';

const Subscription = () => {
  const { adminId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    // Optionally fetch admin details if needed
    const fetchAdmin = async () => {
      try {
        const response = await fetch('https://drz-versiontwo.onrender.com/api/auth/admins');
        const data = await response.json();
        const admin = data.find(a => a._id === adminId || a.id === adminId);
        if (admin) setAdminName(admin.name);
      } catch (err) {
        console.error("Error fetching admin details", err);
      }
    };

    const fetchPlans = async () => {
      try {
        const response = await fetch('https://drz-versiontwo.onrender.com/api/subscription-plans');
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
        }
      } catch (err) {
        console.error("Error fetching plans", err);
      }
    };

    fetchAdmin();
    fetchPlans();
  }, [adminId]);

  const handleUpgrade = async (plan) => {
    if (!window.confirm(`Are you sure you want to upgrade to the ${plan} plan?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://drz-versiontwo.onrender.com/api/auth/admins/${adminId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan._id || plan.id })
      });

      if (!response.ok) throw new Error('Failed to update subscription');
      
      alert(`${plan.name} Plan successfully activated!`);
      navigate('/');
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Failed to update subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '16px', color: '#6366f1', marginRight: '20px' }}
        >
          <FiArrowLeft style={{ marginRight: '8px' }} /> Back
        </button>
        <h2 style={{ margin: 0, color: '#1f2937', fontSize: '28px' }}>
          Choose Subscription Plan {adminName && `for ${adminName}`}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        {plans.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#6b7280' }}>
            No subscription plans available. Please create them in "Manage Plans".
          </div>
        ) : (
          plans.map((plan, index) => {
            const isPopular = plan.isPopular;
            // Cycle through some colors for variety if popular isn't set, or use standard
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
                
                <button 
                  disabled={loading}
                  onClick={() => handleUpgrade(plan)}
                  style={{ ...buttonStyle(isPopular ? bgTheme : '#fff', isPopular ? fgTheme : fgTheme, isPopular ? 'none' : `1px solid ${fgTheme}`), marginTop: 'auto' }}
                >
                  {isPopular ? 'Upgrade Plan' : 'Choose Plan'}
                </button>
              </div>
            );
          })
        )}
      </div>
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

const buttonStyle = (bg, color, border) => ({
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: border,
  backgroundColor: bg,
  color: color,
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'opacity 0.2s ease',
});

export default Subscription;
