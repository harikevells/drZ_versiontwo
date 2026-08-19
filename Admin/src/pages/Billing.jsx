import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { FiPrinter, FiDownload, FiSearch } from 'react-icons/fi';
import Pagination from '../components/Pagination';
import './DoctorManagement.css';
import './Billing.css';

const Billing = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await fetch(`${API_BASE_URL}/emails/all-appointments`, config);
      if (res.ok) {
        const data = await res.json();
        // Only show completed appointments that theoretically should have a billing and consultingFee > 0
        const completed = data.filter(a => String(a.status).toLowerCase() === 'completed' && a.consultingFee && parseFloat(a.consultingFee) > 0);
        setAppointments(completed);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (id) => {
    const url = `${API_BASE_URL}/appointments/${id}/billing-pdf`;
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
        printWindow.onload = () => {
            printWindow.print();
        };
    }
  };

  const handleDownload = (id) => {
    const url = `${API_BASE_URL}/appointments/${id}/billing-pdf`;
    window.open(url, '_blank');
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { 
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ paymentStatus: newStatus })
      };
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/payment`, config);
      if (res.ok) {
        setAppointments(appointments.map(appt => 
          (appt.id === id || appt._id === id) ? { ...appt, paymentStatus: newStatus } : appt
        ));
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handlePaymentTypeChange = async (id, newType) => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { 
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ paymentType: newType })
      };
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/payment`, config);
      if (res.ok) {
        setAppointments(appointments.map(appt => 
          (appt.id === id || appt._id === id) ? { ...appt, paymentType: newType } : appt
        ));
      } else {
        console.error('Failed to update payment type');
      }
    } catch (error) {
      console.error('Error updating payment type:', error);
    }
  };

  const filteredAppointments = appointments.filter(appt => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    const patientName = String(appt.patient_name || '').toLowerCase();
    const docName = String(appt.doctor_name || '').toLowerCase();
    const bookingId = String(appt.id || appt._id || '').toLowerCase();
    return patientName.includes(search) || docName.includes(search) || bookingId.includes(search);
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="page-container">
      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <h2 className="list-title">Billing Details</h2>
        <input 
          type="text" 
          placeholder="Search by Patient, Doctor or ID..." 
          value={searchTerm} 
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }} 
          style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', width: '250px', outline: 'none' }}
        />
      </div>

      <div className="table-container">
        {loading ? (
          <p className="loading-text" style={{textAlign: 'center', padding: '20px'}}>Loading billing details...</p>
        ) : (
          <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Patient Name</th>
                  <th>Doctor Name</th>
                  <th>Date</th>
                  <th>Amount (INR)</th>
                  <th>Payment Type</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAppointments.length > 0 ? paginatedAppointments.map((appt) => {
                  const id = appt.id || appt._id;
                  const displayId = id.slice(-6).toUpperCase();
                  const amount = appt.consultingFee || '0';
                  const isPending = (appt.paymentStatus || 'Pending').toLowerCase() === 'pending';
                  
                  return (
                    <tr key={id}>
                      <td>#{displayId}</td>
                      <td>{appt.patient_name}</td>
                      <td>Dr. {appt.doctor_name}</td>
                      <td>{appt.appointment_date}</td>
                      <td className="amount-cell">₹{amount}</td>
                      <td>
                        <select 
                          className={`status-select ${String(appt.paymentType || 'Offline').toLowerCase()}`}
                          value={appt.paymentType || 'Offline'}
                          onChange={(e) => handlePaymentTypeChange(id, e.target.value)}
                        >
                          <option value="Online">Online</option>
                          <option value="Offline">Offline</option>
                        </select>
                      </td>
                      <td>
                        <select 
                          className={`status-select ${String(appt.paymentStatus || 'Pending').toLowerCase()}`}
                          value={appt.paymentStatus || 'Pending'}
                          onChange={(e) => handleStatusChange(id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Refunds">Refunds</option>
                        </select>
                      </td>
                      <td style={{display:'flex',justifyContent:"center", alignItems:'center'}}>
                        <div className="action-buttons">
                          <button 
                            className="btn-print" 
                            onClick={() => handlePrint(id)} 
                            title={isPending ? "Payment Pending" : "Print Invoice"}
                            disabled={isPending}
                            style={isPending ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                          >
                            <FiPrinter /> Print
                          </button>
                          <button 
                            className="btn-download" 
                            onClick={() => handleDownload(id)} 
                            title={isPending ? "Payment Pending" : "Download PDF"}
                            disabled={isPending}
                            style={isPending ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                          >
                            <FiDownload /> Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" className="text-center">No billing records found</td>
                  </tr>
                )}
              </tbody>
            </table>
        )}
      </div>

      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredAppointments.length}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

export default Billing;
