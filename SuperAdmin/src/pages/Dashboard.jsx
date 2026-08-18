import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaCrown } from 'react-icons/fa';

const Dashboard = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const response = await fetch('https://drz-versiontwo.onrender.com/api/auth/admins');
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
            fetch(`https://drz-versiontwo.onrender.com/api/auth/admins/${admin._id}/status`, {
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
      const response = await fetch(`https://drz-versiontwo.onrender.com/api/auth/admins/${adminId}/status`, {
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
      const response = await fetch(`https://drz-versiontwo.onrender.com/api/auth/admins/${adminId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete admin');
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin: ", error);
      alert("Failed to delete admin");
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
      const response = await fetch(`https://drz-versiontwo.onrender.com/api/auth/admins/${editingAdmin.id}`, {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Admin Management Dashboard</h2>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Access Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No admins found</td>
                </tr>
              ) : (
                admins.map(admin => {
                  const status = getAdminStatus(admin);
                  return (
                    <tr key={admin.id}>
                      <td>{admin.name}</td>
                      <td>{admin.email}</td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>
                          <div>{admin.accessStartDate} {admin.accessStartTime}</div>
                          <div>to {admin.accessEndDate} {admin.accessEndTime}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${status === 'Active' ? 'status-active' : 'status-expired'}`}>
                          {status}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => toggleAdminStatus(admin.id, admin.isActive, admin)}
                          style={{
                            background: admin.isActive ? '#fee2e2' : '#d1fae5',
                            color: admin.isActive ? '#991b1b' : '#065f46',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}
                        >
                          {admin.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => navigate(`/subscription/${admin.id}`)}
                          style={{
                            background: '#fef3c7',
                            color: '#d97706',
                            border: 'none',
                            padding: '6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Subscription Plan"
                        >
                          <FaCrown size={14} />
                        </button>

                        <button
                          onClick={() => openEditModal(admin)}
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: 'none',
                            padding: '6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(admin.id)}
                          style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: 'none',
                            padding: '6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Admin Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem', color: '#1f2937' }}>Edit Admin</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Name</label>
                <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Email</label>
                <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Password (Leave blank to keep current)</label>
                <input type="password" name="password" value={editFormData.password} onChange={handleEditChange} placeholder="Enter new password" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
              </div>

              <h4 style={{ margin: '15px 0 10px 0', fontSize: '1rem', color: '#1f2937' }}>Access Duration</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#4b5563' }}>Start Date</label>
                  <input type="date" name="accessStartDate" value={editFormData.accessStartDate} onChange={handleEditChange} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#4b5563' }}>Start Time</label>
                  <input type="time" name="accessStartTime" value={editFormData.accessStartTime} onChange={handleEditChange} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#4b5563' }}>End Date</label>
                  <input type="date" name="accessEndDate" value={editFormData.accessEndDate} onChange={handleEditChange} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#4b5563' }}>End Time</label>
                  <input type="time" name="accessEndTime" value={editFormData.accessEndTime} onChange={handleEditChange} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
