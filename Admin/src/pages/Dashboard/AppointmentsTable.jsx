import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const AppointmentsTable = ({ appointments = [] }) => {
  const navigate = useNavigate();

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = String(dateStr).split('/');
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr);
  };

  // Sort by latest date and limit to 5
  const recentAppointments = [...appointments]
    .sort((a, b) => parseDate(b.appointment_date) - parseDate(a.appointment_date)) // Newest date first
    .slice(0, 5);

  const formatTimeSlot = (timeStr) => {
    if (!timeStr) return '';
    const str = String(timeStr).trim();
    if (str.toLowerCase().includes('to') || str.includes('-')) return str;
  
    const match = str.match(/(\d+)[:.](\d+)\s*(am|pm)/i);
    if (!match) return str;
  
    let hrs = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const ampm = match[3].toLowerCase();
  
    let hrs24 = hrs;
    if (ampm === 'pm' && hrs24 < 12) hrs24 += 12;
    if (ampm === 'am' && hrs24 === 12) hrs24 = 0;
  
    let eMins = mins;
    let eHrs = hrs24 + 1;
    if (eHrs >= 24) { eHrs -= 24; }
  
    const eAmpm = eHrs >= 12 ? 'pm' : 'am';
    let dHrs = eHrs % 12;
    if (dHrs === 0) dHrs = 12;
  
    const eMinsStr = eMins < 10 ? '0' + eMins : eMins;
    return `${str} to ${dHrs}.${eMinsStr}${eAmpm}`;
  };

  return (
    <div className="table-card">
      <div className="table-header">
        <h3>Appointment List</h3>
      </div>
      
      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Patient Name</th>
              <th>Doctor Name</th>
              <th>Appointment Date</th>
              <th>Appointment Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentAppointments.length > 0 ? (
              recentAppointments.map((appt, idx) => (
                <tr key={idx}>
                  <td className="booking-id">{(appt.id || appt._id || '').slice(-6).toUpperCase()}</td>
                  <td>{appt.patient_name}</td>
                  <td>{(appt.doctor_name || '').split('/')[0].trim()}</td>
                  <td>{appt.appointment_date}</td>
                  <td>{formatTimeSlot(appt.appointment_time)}</td>
                  <td>
                    <span className={`status-badge ${(appt.status || 'Pending').toLowerCase()}`}>
                      {appt.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="action-btn" 
                      onClick={() => navigate('/patient')}
                      style={{ fontSize: '13px', fontWeight: '600', color: '#6366f1', textDecoration: 'underline' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No upcoming appointments found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentsTable;
