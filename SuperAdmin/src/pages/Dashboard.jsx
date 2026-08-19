import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaCrown, FaEnvelope, FaPowerOff, FaUsers, FaShieldAlt, FaCalendarAlt, FaBuilding, FaListUl, FaSearch, FaPlus } from 'react-icons/fa';
import config from '../config';

const Dashboard = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '', email: '', password: '',
    accessStartDate: '', accessStartTime: '',
    accessEndDate: '', accessEndTime: ''
  });

  useEffect(() => {
    fetchAdmins();
    const interval = setInterval(() => {
      fetchAdmins();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/admins`);
      if (!response.ok) throw new Error('Failed to fetch admins');
      const data = await response.json();

      const now = new Date();

      // map _id to id for compatibility with existing UI code
      const adminList = data.map(admin => {
        let isCurrentlyActive = admin.isActive;

        if (admin.accessEndDate && admin.accessEndTime) {
          const endDateTime = new Date(`${admin.accessEndDate}T${admin.accessEndTime}`);

          // Auto-deactivate if time is expired and still active in DB
          if (isCurrentlyActive && now > endDateTime) {
            // Fire and forget update to backend
            fetch(`${config.API_BASE_URL}/auth/admins/${admin._id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: false })
            }).catch(err => console.error("Auto-deactivate failed", err));

            isCurrentlyActive = false; // Optimistically update locally
          }
        }

        return {
          ...admin,
          isActive: isCurrentlyActive,
          id: admin._id
        };
      });

      setAdmins(adminList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admins: ", error);
      setLoading(false);
    }
  };

  const getAdminStatus = (admin) => {
    if (!admin.isActive) return 'Inactive';
    return 'Active';
  };

  const toggleAdminStatus = async (adminId, currentStatus, adminData) => {
    // If trying to activate, check if time is expired
    if (!currentStatus && adminData.accessEndDate && adminData.accessEndTime) {
      const now = new Date();
      const endDateTime = new Date(`${adminData.accessEndDate}T${adminData.accessEndTime}`);
      if (now > endDateTime) {
        alert("Cannot activate! The access period for this admin has expired. Please Edit their 'End Date & Time' first.");
        return;
      }
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/admins/${adminId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (!response.ok) throw new Error('Failed to update admin status');
      fetchAdmins();
    } catch (error) {
      console.error("Error updating admin status: ", error);
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm("Are you sure you want to permanently delete this admin?")) return;
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/admins/${adminId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete admin');
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin: ", error);
      alert("Failed to delete admin");
    }
  };

  const handleSendInvoice = async (adminId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/admins/${adminId}/invoice`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to send invoice');
      } else {
        alert("Invoice sent successfully to the admin's email!");
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Error sending invoice');
    }
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setEditFormData({
      name: admin.name || '',
      email: admin.email || '',
      password: '', // Blank by default, only update if typed
      accessStartDate: admin.accessStartDate || '',
      accessStartTime: admin.accessStartTime || '',
      accessEndDate: admin.accessEndDate || '',
      accessEndTime: admin.accessEndTime || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/admins/${editingAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      if (!response.ok) throw new Error('Failed to update admin');
      setIsEditModalOpen(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error updating admin: ", error);
      alert("Failed to update admin");
    }
  };

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter(a => a.isActive).length;

  const getExpiringSoonCount = () => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    return admins.filter(a => {
      if (!a.isActive || !a.accessEndDate) return false;
      const endDate = new Date(`${a.accessEndDate}T${a.accessEndTime || '00:00'}`);
      return endDate > now && endDate <= nextWeek;
    }).length;
  };

  const expiringSoonCount = getExpiringSoonCount();
  const superAdminsCount = 1;

  const filteredAdmins = admins.filter(admin => {
    const search = searchTerm.toLowerCase();
    return (admin.name || '').toLowerCase().includes(search) ||
      (admin.email || '').toLowerCase().includes(search);
  });

  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FaUsers />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Admins</span>
            <span className="stat-value">{totalAdmins}</span>
            <span className="stat-desc">Active hospitals</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <FaShieldAlt />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active Admins</span>
            <span className="stat-value">{activeAdmins}</span>
            <span className="stat-desc">Currently active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <span className="stat-label">Expiring Soon</span>
            <span className="stat-value">{expiringSoonCount}</span>
            <span className="stat-desc">In next 7 days</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <FaCrown />
          </div>
          <div className="stat-content">
            <span className="stat-label">Super Admins</span>
            <span className="stat-value">{superAdminsCount}</span>
            <span className="stat-desc">System owner</span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div className="table-title">
            <FaListUl color="#5F76FE" /> Admin List
          </div>
          <div className="table-actions">
            <div style={{ position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#a3aed0' }} />
              <input
                type="text"
                className="search-input"
                placeholder="Search hospital or email..."
                style={{ paddingLeft: '35px' }}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button className="btn-primary" onClick={() => navigate('/create-admin')}>
              <FaPlus /> Add New Admin
            </button>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Hospital Name</th>
                <th>Email Address</th>
                <th>Access Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAdmins.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>No admins found</td>
                </tr>
              ) : (
                paginatedAdmins.map((admin, index) => {
                  const status = getAdminStatus(admin);
                  // Generating a color based on index for the hospital icon
                  const iconColors = ['#eff6ff', '#d1fae5', '#f3e8ff', '#fff7ed'];
                  const textColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f97316'];
                  const colorIdx = index % 4;

                  return (
                    <tr key={admin.id}>
                      <td>
                        <div className="hospital-cell">
                          <div className="hospital-icon" style={{ background: iconColors[colorIdx], color: textColors[colorIdx] }}>
                            <FaBuilding />
                          </div>
                          <span className="hospital-name">{admin.name}</span>
                        </div>
                      </td>
                      <td style={{ color: '#64748b' }}>{admin.email}</td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaCalendarAlt color="#cbd5e1" /> {admin.accessStartDate} {admin.accessStartTime}
                          </div>
                          <div style={{ paddingLeft: '20px' }}>
                            to {admin.accessEndDate} {admin.accessEndTime}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${status === 'Active' ? 'status-active' : 'status-expired'}`}>
                          <div className="status-dot"></div> {status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <button
                            className="action-btn send"
                            onClick={() => handleSendInvoice(admin.id)}
                            disabled={!admin.isActive}
                            style={{ opacity: admin.isActive ? 1 : 0.5, cursor: admin.isActive ? 'pointer' : 'not-allowed' }}
                            title="Send Invoice"
                          >
                            <FaEnvelope /> Send
                          </button>

                          <button
                            className="action-btn deactivate"
                            onClick={() => toggleAdminStatus(admin.id, admin.isActive, admin)}
                            style={{
                              background: admin.isActive ? '#fef2f2' : '#d1fae5',
                              color: admin.isActive ? '#ef4444' : '#10b981',
                            }}
                          >
                            <FaPowerOff /> {admin.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          <button
                            className="action-icon-btn crown"
                            onClick={() => navigate(`/subscription/${admin.id}`)}
                            title="Subscription Plan"
                          >
                            <FaCrown />
                          </button>

                          <button
                            className="action-icon-btn edit"
                            onClick={() => openEditModal(admin)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="action-icon-btn delete"
                            onClick={() => handleDelete(admin.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="pagination-footer">
            <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAdmins.length)} of {filteredAdmins.length} entries</span>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  className={`page-btn ${currentPage === num ? 'active' : ''}`}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Admin Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem', color: '#1f2937', fontWeight: '700' }}>Edit Admin</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>Name</label>
                <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>Email</label>
                <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>Password (Leave blank to keep current)</label>
                <input type="password" name="password" value={editFormData.password} onChange={handleEditChange} placeholder="Enter new password" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} />
              </div>

              <h4 style={{ margin: '15px 0 10px 0', fontSize: '1rem', color: '#1f2937', fontWeight: '600' }}>Access Duration</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>Start Date</label>
                  <input type="date" name="accessStartDate" value={editFormData.accessStartDate} onChange={handleEditChange} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>Start Time</label>
                  <input type="time" name="accessStartTime" value={editFormData.accessStartTime} onChange={handleEditChange} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>End Date</label>
                  <input type="date" name="accessEndDate" value={editFormData.accessEndDate} onChange={handleEditChange} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>End Time</label>
                  <input type="time" name="accessEndTime" value={editFormData.accessEndTime} onChange={handleEditChange} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '10px 20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #5F76FE, #8195ff)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
