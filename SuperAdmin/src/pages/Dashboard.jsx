import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

const Dashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const adminList = [];
      querySnapshot.forEach((doc) => {
        adminList.push({ id: doc.id, ...doc.data() });
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
    
    const now = new Date();
    
    // Create Date objects from the stored strings
    // Format stored is typically "yyyy-MM-dd" for date and "HH:mm" for time
    const startDateTime = new Date(`${admin.accessStartDate}T${admin.accessStartTime}`);
    const endDateTime = new Date(`${admin.accessEndDate}T${admin.accessEndTime}`);
    
    if (now >= startDateTime && now <= endDateTime) {
      return 'Active';
    } else {
      return 'Expired';
    }
  };

  const toggleAdminStatus = async (adminId, currentStatus) => {
    try {
      const adminRef = doc(db, 'admins', adminId);
      await updateDoc(adminRef, {
        isActive: !currentStatus
      });
      fetchAdmins(); // Refresh the list
    } catch (error) {
      console.error("Error updating admin status: ", error);
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
                      <td>
                        <button 
                          onClick={() => toggleAdminStatus(admin.id, admin.isActive)}
                          style={{
                            background: 'none',
                            border: '1px solid #e2e8f0',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {admin.isActive ? 'Deactivate' : 'Activate'}
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
    </div>
  );
};

export default Dashboard;
