import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { FiPrinter, FiDownload, FiSearch } from 'react-icons/fi';
import Pagination from '../components/Pagination';
import './Billing.css';

const Billing = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        // Only show completed appointments that theoretically should have a billing
        const completed = data.filter(a => String(a.status).toLowerCase() === 'completed');
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
    <div className="billing-container">
      <div className="billing-header">
        <h2>Billing Details</h2>
        <div className="billing-actions">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Patient, Doctor or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className="billing-table-wrapper">
        {loading ? (
          <p className="loading-text">Loading billing details...</p>
        ) : (
          <>
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Patient Name</th>
                  <th>Doctor Name</th>
                  <th>Date</th>
                  <th>Amount (INR)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAppointments.length > 0 ? paginatedAppointments.map((appt) => {
                  const id = appt.id || appt._id;
                  const displayId = id.slice(-6).toUpperCase();
                  const amount = appt.consultingFee || '0';
                  
                  return (
                    <tr key={id}>
                      <td>#{displayId}</td>
                      <td>{appt.patient_name}</td>
                      <td>Dr. {appt.doctor_name}</td>
                      <td>{appt.appointment_date}</td>
                      <td className="amount-cell">₹{amount}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-print" onClick={() => handlePrint(id)} title="Print Invoice">
                            <FiPrinter /> Print
                          </button>
                          <button className="btn-download" onClick={() => handleDownload(id)} title="Download PDF">
                            <FiDownload /> Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="text-center">No billing records found</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredAppointments.length}
                itemsPerPage={itemsPerPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Billing;
