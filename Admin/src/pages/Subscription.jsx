import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiArrowLeft, FiShield, FiFileText } from 'react-icons/fi';
import { FaCrown, FaPaperPlane, FaGem, FaHeadset, FaPhoneAlt, FaMapMarkerAlt, FaHeartbeat } from 'react-icons/fa';
import termscenterimage from '../assets/termscenterimage.png';
import contactsupport from '../assets/contactsupport.png';
import adminLogo from '../assets/Adminlogo.svg';
import './Sub.css';

const Subscription = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleBackToLogin = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('adminId');
    sessionStorage.removeItem('loginTimestamp');
    navigate('/login');
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('https://drz-versiontwo.onrender.com/api/subscription-plans');
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
        }
      } catch (err) {
        console.error("Error fetching plans", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="sub-container" style={{ justifyContent: 'center' }}>
        <h2>Loading Pricing Plans...</h2>
      </div>
    );
  }

  return (
    <div className="sub-container">
      <div className="sub-header">
        <button className="back-to-login-btn" onClick={handleBackToLogin}>
          <FiArrowLeft /> Back to Login
        </button>
      </div>
      
      <div className="sub-title-container">
        <h1 className="sub-title">Choose the <span>Best Plan</span> for Your Hospital</h1>
        <p className="sub-subtitle">Simple, Transparent & Affordable Subscription Plans</p>
      </div>

      <div className="sub-grid">
        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', width: '100%', color: '#6b7280', gridColumn: '1 / -1' }}>
            <h2>No plans available at the moment.</h2>
          </div>
        ) : (
          plans.map((plan, index) => {
            const isPopular = plan.isPopular;
            const nameLower = plan.name ? plan.name.toLowerCase() : '';
            
            // Map colors based on the image's Bronze/Gold/Platinum scheme
            let bgGradient, iconColor, icon;
            let description = "Essential tools to manage your hospital";
            
            if (nameLower.includes('gold') || isPopular) {
              bgGradient = 'linear-gradient(135deg, #fce07a 0%, #f39c12 100%)'; 
              iconColor = '#f59e0b'; 
              icon = <FaCrown style={{ color: iconColor }} />;
              description = "Advanced features for growing hospitals";
            } else if (nameLower.includes('platinum') || index % 3 === 2) {
              bgGradient = 'linear-gradient(135deg, #8ba1fe 0%, #5f76fe 100%)'; 
              iconColor = '#5f76fe'; 
              icon = <FaGem style={{ color: iconColor }} />;
              description = "Complete solution for large hospitals";
            } else {
              // Default to Bronze
              bgGradient = 'linear-gradient(135deg, #cd7f32 0%, #8b4513 100%)'; 
              iconColor = '#b5651d'; 
              icon = <FaPaperPlane style={{ color: iconColor }} />;
              description = "Essential tools to manage your hospital";
            }

            return (
              <div key={plan._id || plan.id} className={`sub-card ${isPopular ? 'popular' : ''}`}>
                {isPopular && <div className="popular-badge">★ Most Popular</div>}
                
                <div className="card-header-bg" style={{ background: bgGradient }}></div>
                
                <div className="card-title">{plan.name}</div>
                
                <div className="sub-icon">
                  {icon}
                </div>
                
                <p className="sub-desc">{description}</p>
                
                <div className="sub-price-wrapper">
                  <div className="sub-price-row">
                    <span className="sub-price">₹{plan.price}</span>
                    <span className="sub-duration">/ {plan.durationValue} {plan.durationType}</span>
                  </div>
                  <span className="sub-billed">Billed {plan.durationType}</span>
                </div>
                
                <ul className="sub-features">
                  {(plan.features || []).map((feature, i) => (
                    <li key={i} className="sub-feature-item">
                      <div className="sub-feature-icon" style={{ background: iconColor }}>
                        <FiCheck size={12} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>

      {/* Info Section: Privacy Policy & Terms */}
      <div className="sub-info-section">
        <div id="privacy-policy" className="sub-info-card">
          <div className="sub-info-header">
            <FiShield /> Privacy Policy
          </div>
          <p className="sub-info-text">
            At DrZ, we are committed to protect your privacy and ensure the security of your information.
          </p>
          <ul className="sub-info-list">
            <li><FiCheck /> We collect only necessary information to provide our services.</li>
            <li><FiCheck /> Your data is used strictly to manage your account and improve your experience.</li>
            <li><FiCheck /> We do not sell or share your information with anyone.</li>
            <li><FiCheck /> We use industry-standard security measures to protect your data.</li>
            <li><FiCheck /> For any details related to privacy, data usage or your rights, please contact the DrZ Administrator.</li>
          </ul>
        </div>
        
        {/* Middle Image graphic from design */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '200px' }}>
          <img src={termscenterimage} alt="Terms and Privacy" style={{ width: '220px', height: 'auto', objectFit: 'contain' }} />
        </div>

        <div id="terms-conditions" className="sub-info-card">
          <div className="sub-info-header">
            <FiFileText /> Terms & Conditions
          </div>
          <p className="sub-info-text">
            Please read these terms and conditions carefully before using DrZ services.
          </p>
          <ul className="sub-info-list">
            <li><FiCheck /> Subscription plans are billed in advance and are non-refundable.</li>
            <li><FiCheck /> Features, limits and support may vary based on the plan.</li>
            <li><FiCheck /> You are responsible for maintaining the confidentiality of your account.</li>
            <li><FiCheck /> DrZ reserves the right to modify or discontinue any service with prior notice.</li>
            <li><FiCheck /> For any subscription, billing, plan upgrade, renewal or other please details, contact the DrZ Administrator.</li>
          </ul>
        </div>
      </div>

      {/* Support Banner */}
      <div className="sub-support-banner">
        <div className="support-left">
          <div className="support-image-wrapper" style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: '#5f76fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 10px rgba(95, 118, 254, 0.3)'
          }}>
            <img src={contactsupport} alt="Support Agent" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
          </div>
          <div className="support-content">
            <h3>Need Any Help?</h3>
            <p>For any subscription, billing, technical, plan upgrade,<br/>renewal or other service related details,<br/>please contact the DrZ Administrator.</p>
          </div>
        </div>
        
        <div className="support-contact-box">
          <FaPhoneAlt />
          <div className="contact-details">
            <h4>8989898989</h4>
            <p>Call or WhatsApp</p>
          </div>
        </div>
        
        <div className="support-contact-box">
          <FaMapMarkerAlt />
          <div className="contact-details">
            <h4>Madurai</h4>
            <p>Tamil Nadu, India</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sub-footer">
        <div className="sub-footer-brand">
          <img src={adminLogo} alt="DrZ Logo" style={{ height: '35px', filter: 'brightness(0) invert(1)' }} />
        </div>
        <div>
          © 2026 DrZ. All rights reserved.
        </div>
        <div className="sub-footer-links">
          <a href="#" onClick={(e) => scrollToSection(e, 'privacy-policy')}>Privacy Policy</a>
          <span>|</span>
          <a href="#" onClick={(e) => scrollToSection(e, 'terms-conditions')}>Terms & Conditions</a>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
