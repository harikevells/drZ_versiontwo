import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserMd, FaCalendarCheck, FaRegClock } from 'react-icons/fa';
import StatCard from './StatCard';
import OverviewChart from './OverviewChart';
import StatusChart from './StatusChart';
import AppointmentsTable from './AppointmentsTable';
import { API_BASE_URL } from '../../config';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [apptRes, docsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/emails/all-appointments`, config),
          fetch(`${API_BASE_URL}/doctors`, config)
        ]);

        if (apptRes.ok && docsRes.ok) {
          const apptData = await apptRes.json();
          const docsData = await docsRes.json();
          setAppointments(apptData);
          setDoctors(docsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const todayFormatted = `${day}/${month}/${year}`;

  const totalAppointments = appointments.length;
  const totalDoctors = doctors.length;
  const todayAppointments = appointments.filter(a => a.appointment_date && a.appointment_date.replace(/\s+/g, '').includes(todayFormatted)).length;

  const uniquePatients = new Set();
  appointments.forEach(a => {
    if (a.patientId && a.patientId !== 'N/A') {
      uniquePatients.add(a.patientId);
    } else {
      const mobile = a.login_mobile || 'no-mobile';
      const name = a.patient_name || 'no-name';
      uniquePatients.add(`${mobile}-${name}`.toLowerCase());
    }
  });
  const totalPatients = uniquePatients.size;

  const stats = [
    { title: 'Total Patients', value: totalPatients.toString(), percent: '+ 0%', percentType: 'up', timeframe: 'all time', icon: <FaUsers />, color: '#6366f1', bgColor: '#eef2ff' },
    { title: 'Total Doctors', value: totalDoctors.toString(), percent: '+ 0%', percentType: 'up', timeframe: 'all time', icon: <FaUserMd />, color: '#3b82f6', bgColor: '#eff6ff' },
    { title: 'Total Appointments', value: totalAppointments.toString(), percent: '+ 0%', percentType: 'up', timeframe: 'all time', icon: <FaCalendarCheck />, color: '#10b981', bgColor: '#ecfdf5' },
    { title: "Today's Appointments", value: todayAppointments.toString(), percent: '0%', percentType: 'up', timeframe: 'today', icon: <FaRegClock />, color: '#f59e0b', bgColor: '#fffbeb' }
  ];

  // Process Pie Chart Data (By Status)
  let completed = 0, pending = 0, cancelled = 0, rescheduled = 0;
  appointments.forEach(a => {
    const s = (a.status || 'Pending').toLowerCase();
    if (s === 'completed') completed++;
    else if (s === 'cancelled') cancelled++;
    else if (s === 'rescheduled') rescheduled++;
    else pending++;
  });

  const pieData = [
    { name: 'Completed', value: completed, color: '#818cf8', percentage: totalAppointments ? ((completed / totalAppointments) * 100).toFixed(1) + '%' : '0%' },
    { name: 'Pending', value: pending, color: '#fbbf24', percentage: totalAppointments ? ((pending / totalAppointments) * 100).toFixed(1) + '%' : '0%' },
    { name: 'Cancelled', value: cancelled, color: '#38bdf8', percentage: totalAppointments ? ((cancelled / totalAppointments) * 100).toFixed(1) + '%' : '0%' },
    { name: 'Reschedule', value: rescheduled, color: '#4ade80', percentage: totalAppointments ? ((rescheduled / totalAppointments) * 100).toFixed(1) + '%' : '0%' }
  ];

  if (loading) {
    return <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2>Loading Dashboard...</h2></div>;
  }

  return (
    <div className="dashboard-container">
      {/* Top Stats Row */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <StatCard key={idx} stat={stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <OverviewChart appointments={appointments} />
        <StatusChart data={pieData} total={totalAppointments} />
      </div>

      {/* Table Row */}
      <AppointmentsTable appointments={appointments} />
    </div>
  );
};

export default Dashboard;
