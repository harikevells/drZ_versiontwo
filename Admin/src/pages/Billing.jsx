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
  const [filterDate, setFilterDate] = useState('');
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
    // 1. Date Filter (DD/MM/YYYY match)
    if (filterDate) {
      const [year, month, day] = filterDate.split('-');
      const formattedFilterDate = `${day}/${month}/${year}`;
      if (appt.appointment_date !== formattedFilterDate) return false;
    }

    // 2. Global Search
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    const fieldsToSearch = [
      appt.appointmentId,
      appt.patientId,
      appt.patient_name,
      appt.doctor_name,
      appt.appointment_date,
      appt.paymentStatus,
      appt.paymentType,
      appt.consultingFee,
      appt.id,
      appt._id
    ];

    return fieldsToSearch.some(field => String(field || '').toLowerCase().includes(search));
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const todayDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const metrics = appointments.reduce((acc, appt) => {
    const amount = parseFloat(appt.consultingFee || 0);
    const status = String(appt.paymentStatus || 'Pending').toLowerCase();

    if (status === 'paid') {
      acc.totalProfits += amount;
      if (appt.appointment_date === todayDate) {
        acc.todayProfits += amount;
      }
    } else if (status === 'pending') {
      acc.pending += amount;
    } else if (status === 'refunds') {
      acc.refunds += amount;
    }
    return acc;
  }, { totalProfits: 0, pending: 0, refunds: 0, todayProfits: 0 });

  return (
    <div style={{ minHeight: '83vh' }} className="page-container">
      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <h2 className="list-title">Billing Details</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setCurrentPage(1);
            }}
            style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
          />
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
      </div>

      <div className="billing-metrics-container">
        <div className="metric-box">
          <div className="metric-title">Total Profit's</div>
          <div className="metric-amount">₹{metrics.totalProfits.toLocaleString('en-IN')}</div>
        </div>
        <div className="metric-box pending">
          <div className="metric-title">Pending</div>
          <div className="metric-amount">₹{metrics.pending.toLocaleString('en-IN')}</div>
        </div>
        <div className="metric-box refunds">
          <div className="metric-title">Refunds</div>
          <div className="metric-amount">₹{metrics.refunds.toLocaleString('en-IN')}</div>
        </div>
        <div className="metric-box today">
          <div className="metric-title">Today profit's</div>
          <div className="metric-amount">₹{metrics.todayProfits.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <p className="loading-text" style={{ textAlign: 'center', padding: '20px' }}>Loading billing details...</p>
        ) : (
          <table className="billing-table">
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Patient ID</th>
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
                const displayApptId = appt.appointmentId || 'N/A';
                const displayPatId = appt.patientId || 'N/A';
                const amount = appt.consultingFee || '0';
                const isPending = (appt.paymentStatus || 'Pending').toLowerCase() === 'pending';

                return (
                  <tr key={id}>
                    <td>{displayApptId}</td>
                    <td>{displayPatId}</td>
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
                    <td style={{ display: 'flex', justifyContent: "center", alignItems: 'center' }}>
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
                  <td colSpan="9" className="text-center">No billing records found</td>
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
