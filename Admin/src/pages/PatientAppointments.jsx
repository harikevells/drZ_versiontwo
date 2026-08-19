import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { API_BASE_URL } from '../config';
import { FaEye, FaTimes, FaPlus } from 'react-icons/fa';
import Pagination from '../components/Pagination';
import './PatientAppointments.css';

const CustomDateInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
  <div className="date-picker-input-wrapper" onClick={onClick}>
    <input
      className="date-input"
      value={value}
      onClick={onClick}
      onChange={() => { }}
      placeholder={placeholder}
      ref={ref}
      required
    />
    <svg className="calendar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5b6473" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  </div>
));

const tamilTranslations = {
  'General': 'பொது மருத்துவம்',
  'General Care': 'பொது நலம்',
  'Cardiology': 'இருதயவியல்',
  'Neurology': 'நரம்பியல்',
  'Orthopedics': 'எலும்பியல்',
  'Pediatrics': 'குழந்தை மருத்துவம்',
  'Dermatology': 'தோல் மருத்துவம்',
  'General Surgery': 'பொது அறுவை சிகிச்சை',
  'Psychiatry': 'மனநல மருத்துவம்',
  'Gynecology': 'மகளிர் மருத்துவம்',
  'Oncology': 'புற்றுநோயியல்',
  'Ophthalmology': 'கண் மருத்துவம்',
  'Urology': 'சிறுநீரகவியல்',
  'ENT': 'காது மூக்கு தொண்டை',
  'Dentistry': 'பல் மருத்துவம்',
  'Radiology': 'கதிரியக்கவியல்',
  'General Physician': 'பொது மருத்துவர்',
  'Physiotherapy': 'இயன்முறை மருத்துவம்',
  'Multi Speciality': 'பல்துறை சிறப்பு'
};

const parseTimeStringToMinutes = (timeStr) => {
  try {
    let clean = timeStr.toLowerCase().replace(/\s+/g, ' ').trim();
    const isPM = clean.includes('pm');
    const isAM = clean.includes('am');
    clean = clean.replace('am', '').replace('pm', '').trim();

    let hours = -1;
    let minutes = 0;

    if (clean.includes(':') || clean.includes('.')) {
      const parts = clean.split(/[:.]/);
      hours = parseInt(parts[0], 10);
      minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    } else {
      const spaceParts = clean.split(/\s+/);
      if (spaceParts.length >= 2) {
        hours = parseInt(spaceParts[0], 10);
        minutes = parseInt(spaceParts[1], 10);
      } else {
        const digitsOnly = clean.replace(/\D/g, '');
        if (digitsOnly.length === 3) {
          hours = parseInt(digitsOnly.substring(0, 1), 10);
          minutes = parseInt(digitsOnly.substring(1, 3), 10);
        } else if (digitsOnly.length === 4) {
          hours = parseInt(digitsOnly.substring(0, 2), 10);
          minutes = parseInt(digitsOnly.substring(2, 4), 10);
        } else if (digitsOnly.length === 1 || digitsOnly.length === 2) {
          hours = parseInt(digitsOnly, 10);
          minutes = 0;
        }
      }
    }

    if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
      return -1;
    }

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  } catch (err) {
    return -1;
  }
};

const removeTamil = (text) => {
  if (!text) return '';
  const strText = String(text);
  return strText.split(',').map(item => item.split('/')[0].trim()).join(', ');
};

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

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Create Appointment Form & Data States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [whatsapp, setWhatsapp] = useState('');
  const [patientMobile, setPatientMobile] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isVideoCall, setIsVideoCall] = useState(false);

  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [selectedPatientValue, setSelectedPatientValue] = useState('');
  const [allSchedules, setAllSchedules] = useState([]);
  const [dateSchedules, setDateSchedules] = useState([]);
  const [availableDoctorsForDate, setAvailableDoctorsForDate] = useState([]);
  const [doctorCategories, setDoctorCategories] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [availableTimings, setAvailableTimings] = useState([]);
  const [bookedByDoctor, setBookedByDoctor] = useState({});
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const categoryDropdownRef = React.useRef(null);
  const doctorDropdownRef = React.useRef(null);
  const patientDropdownRef = React.useRef(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target)) {
        setIsDoctorDropdownOpen(false);
      }
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  // Extract unique patients from previous appointments list
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      const patientMap = new Map();
      appointments.forEach((app) => {
        const mobile = app.login_mobile;
        if (mobile && mobile !== 'N/A') {
          const wsParts = (app.whatsapp_number || '').split('|');
          const cleanWhatsapp = wsParts[0];

          if (!patientMap.has(mobile)) {
            patientMap.set(mobile, {
              label: `${app.patient_name} (${mobile})`,
              value: mobile,
              name: app.patient_name,
              age: String(app.patient_age || ''),
              gender: app.patient_gender === 'Female' ? 'Female' : 'Male',
              whatsapp: cleanWhatsapp,
              mobile: mobile,
            });
          }
        }
      });
      setRegisteredPatients(Array.from(patientMap.values()));
    }
  }, [appointments]);

  const matchDate = (itemDate, selectedDate) => {
    if (!selectedDate) return true;
    if (!itemDate) return false;

    const [y, m, d] = selectedDate.split('-');
    const selectedDDMMYYYY = `${d}/${m}/${y}`;
    const selectedDDMMDotYYYY = `${d}/${m}.${y}`;
    const selectedDDMMDotYYYYAlt = `${parseInt(d, 10)}/${parseInt(m, 10)}.${y}`;
    const selectedDDMMYYYYAlt = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;

    const cleanItemDate = String(itemDate).replace(/\s+/g, '');

    return (
      cleanItemDate === selectedDate ||
      cleanItemDate === selectedDDMMYYYY ||
      cleanItemDate === selectedDDMMDotYYYY ||
      cleanItemDate === selectedDDMMDotYYYYAlt ||
      cleanItemDate === selectedDDMMYYYYAlt ||
      cleanItemDate.includes(selectedDDMMYYYY) ||
      cleanItemDate.includes(selectedDDMMDotYYYY)
    );
  };

  const filteredAppointments = appointments.filter(appt => {
    if (!matchDate(appt.appointment_date, dateFilter)) {
      return false;
    }

    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    const patientName = String(appt.patient_name || '').toLowerCase();
    const docNameClean = String(removeTamil(appt.doctor_name)).toLowerCase();
    const docNameRaw = String(appt.doctor_name || '').toLowerCase();
    const bookingId = String(appt.id || appt._id || '').toLowerCase();
    const status = String(appt.status || 'Pending').toLowerCase();

    return (
      patientName.includes(search) ||
      docNameClean.includes(search) ||
      docNameRaw.includes(search) ||
      bookingId.includes(search) ||
      status.includes(search)
    );
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchAppointmentsAndDoctors();
    const intervalId = setInterval(fetchAppointmentsAndDoctors, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchAppointmentsAndDoctors = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [apptRes, docsRes, schedulesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/emails/all-appointments`, config),
        fetch(`${API_BASE_URL}/doctors`, config),
        fetch(`${API_BASE_URL}/schedules`, config)
      ]);

      if (apptRes.ok && docsRes.ok) {
        const apptData = await apptRes.json();
        const docsData = await docsRes.json();
        setAppointments(apptData);
        setDoctors(docsData);

        if (schedulesRes && schedulesRes.ok) {
          const schedulesData = await schedulesRes.json();
          setAllSchedules(schedulesData);
        }
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDates = () => {
    const approvedSchedules = allSchedules.filter(s => s.status === 'Approved');
    const dateSet = new Set();
    approvedSchedules.forEach(s => {
      if (s.date) {
        let d = null;
        if (s.date.includes('-')) {
          const parts = s.date.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            } else {
              d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
          }
        } else if (s.date.includes('/')) {
          const parts = s.date.split('/');
          if (parts.length === 3) {
            if (parts[2].length === 4) {
              d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            } else if (parts[0].length === 4) {
              d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            }
          }
        } else {
          d = new Date(s.date);
        }

        if (d && !isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dateDay = String(d.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${dateDay}`;
          dateSet.add(dateStr);
        }
      }
    });
    return Array.from(dateSet).sort();
  };

  const fetchSchedulesForDate = async (selectedDateStr) => {
    if (!selectedDateStr) return;
    try {
      const [year, month, day] = selectedDateStr.split('-');
      const formattedDateForSchedules = `${year}-${month}-${day}`;
      const formattedDateForAppointments = `${day}/${month}/${year}`;

      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [schedulesRes, appointmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/schedules?date=${formattedDateForSchedules}`, config),
        fetch(`${API_BASE_URL}/emails/booked-timings?appointment_date=${encodeURIComponent(formattedDateForAppointments)}&_t=${Date.now()}`, config)
      ]);

      if (schedulesRes.ok && appointmentsRes.ok) {
        const schedulesData = await schedulesRes.json();
        const appointmentsData = await appointmentsRes.json();

        const approvedSchedules = (schedulesData || []).filter((s) => {
          if (s.status !== 'Approved') return false;
          return doctors.some((doc) => doc._id === s.doctorId || doc.id === s.doctorId || doc.doctorName === s.doctorName);
        });
        setDateSchedules(approvedSchedules);

        const bookedMap = {};
        (appointmentsData || []).forEach((app) => {
          if (!['Pending', 'Approved', 'Rescheduled'].includes(app.status)) return;
          const docName = (app.doctor_name || '').trim();
          if (!bookedMap[docName]) bookedMap[docName] = [];
          bookedMap[docName].push((app.appointment_time || '').trim());
        });
        setBookedByDoctor(bookedMap);

        const activeDocs = doctors.filter((doc) =>
          approvedSchedules.some((s) => s.doctorId === doc._id || s.doctorId === doc.id || s.doctorName === doc.doctorName)
        );
        setAvailableDoctorsForDate(activeDocs);

        const uniqueDepts = new Set();
        activeDocs.forEach((doc) => {
          if (doc.department) {
            doc.department.split(',').forEach((dep) => {
              const fullDeptName = dep.trim();
              if (fullDeptName) uniqueDepts.add(fullDeptName);
            });
          }
        });

        const departments = Array.from(uniqueDepts);
        const formattedCategories = departments.map((cat, index) => {
          const originalName = cat.split('/')[0].trim();
          const tamilName = tamilTranslations[originalName];
          const displayName = (tamilName && !cat.includes('/')) ? `${originalName} / ${tamilName}` : cat;

          return {
            _id: String(index + 1),
            name: displayName,
            originalName: originalName,
            fullDepartment: cat
          };
        });

        setDoctorCategories(formattedCategories);
        setSelectedCategory(null);
        setSelectedDoctor(null);
        setDoctorList([]);
        setAvailableTimings([]);
      }
    } catch (error) {
      console.error('Error fetching schedules for date:', error);
    }
  };

  useEffect(() => {
    if (appointmentDate) {
      fetchSchedulesForDate(appointmentDate);
    }
  }, [appointmentDate]);

  useEffect(() => {
    if (selectedDoctor && appointmentDate) {
      const schedulesForDoctor = dateSchedules.filter((s) =>
        s.doctorId === selectedDoctor._id ||
        s.doctorId === selectedDoctor.id ||
        s.doctorName === selectedDoctor.name
      );

      if (schedulesForDoctor.length > 0) {
        const allTimings = schedulesForDoctor.flatMap((s) => s.time || []);
        let uniqueTimings = Array.from(new Set(allTimings));

        const today = new Date();
        const [y, m, dateDay] = appointmentDate.split('-').map(Number);
        const isToday = y === today.getFullYear() && (m - 1) === today.getMonth() && dateDay === today.getDate();
        if (isToday) {
          const currentMinutes = today.getHours() * 60 + today.getMinutes();
          uniqueTimings = uniqueTimings.filter(t => {
            const startStr = t.split(/to|\-/)[0].trim();
            const startMins = parseTimeStringToMinutes(startStr);
            return startMins > currentMinutes;
          });
        }
        setAvailableTimings(uniqueTimings);
      } else {
        setAvailableTimings([]);
      }
    } else {
      setAvailableTimings([]);
    }
    setSelectedTime('');
  }, [selectedDoctor, dateSchedules]);

  const handlePatientSelect = (e) => {
    const mobile = e.target.value;
    const item = registeredPatients.find(p => p.value === mobile);
    if (item) {
      setSelectedPatientValue(item.value);
      setPatientName(item.name);
      setAge(item.age);
      setGender(item.gender);
      setWhatsapp(item.whatsapp);
      setPatientMobile(item.mobile);
    } else {
      setSelectedPatientValue('');
    }
  };

  const handleClearPatientSelect = () => {
    setSelectedPatientValue('');
    setPatientName('');
    setAge('');
    setGender('Male');
    setWhatsapp('');
    setPatientMobile('');
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const item = doctorCategories.find(cat => cat._id === categoryId);
    if (!item) {
      setSelectedCategory(null);
      setDoctorList([]);
      setSelectedDoctor(null);
      return;
    }
    setSelectedCategory(item);

    const docsForCategory = availableDoctorsForDate.filter((doc) => {
      if (!doc.department) return item.originalName === 'Others';
      const depts = doc.department.split(',').map((cat) => cat.trim());
      const isMatched = depts.includes(item.fullDepartment);
      if (!isMatched) return false;

      // Filter out doctors who have no remaining available/unbooked timing slots on the selected date
      const schedulesForDoctor = dateSchedules.filter((s) =>
        s.doctorId === doc._id ||
        s.doctorId === doc.id ||
        s.doctorName === doc.doctorName
      );
      if (schedulesForDoctor.length === 0) return false;

      const allTimings = schedulesForDoctor.flatMap((s) => s.time || []);
      let uniqueTimings = Array.from(new Set(allTimings));

      const today = new Date();
      const [y, m, dateDay] = appointmentDate.split('-').map(Number);
      const isToday = y === today.getFullYear() && (m - 1) === today.getMonth() && dateDay === today.getDate();
      if (isToday) {
        const currentMinutes = today.getHours() * 60 + today.getMinutes();
        uniqueTimings = uniqueTimings.filter(t => {
          const startStr = t.split(/to|\-/)[0].trim();
          const startMins = parseTimeStringToMinutes(startStr);
          return startMins > currentMinutes;
        });
      }

      const bookedTimingsForCurrentDoctor = bookedByDoctor[doc.doctorName] || [];
      const remainingTimings = uniqueTimings.filter(t => !bookedTimingsForCurrentDoctor.includes(t.trim()));

      return remainingTimings.length > 0;
    });

    const formattedDocs = docsForCategory.map((doc) => ({
      _id: doc._id || doc.id,
      name: doc.doctorName
    }));
    setDoctorList(formattedDocs);
    setSelectedDoctor(null);
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    const item = doctorList.find(doc => doc._id === doctorId);
    if (!item) {
      setSelectedDoctor(null);
      return;
    }
    setSelectedDoctor(item);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!patientName.trim()) {
      alert('Please enter patient name.');
      return;
    }
    if (!age.trim() || isNaN(Number(age))) {
      alert('Please enter a valid age.');
      return;
    }
    if (!gender) {
      alert('Please select patient gender.');
      return;
    }
    if (whatsapp.trim() && (whatsapp.trim().length !== 10 || isNaN(Number(whatsapp.trim())))) {
      alert('Please enter a valid 10-digit WhatsApp number.');
      return;
    }
    if (!patientMobile.trim()) {
      alert('Please enter patient mobile number.');
      return;
    }
    if (patientMobile.trim().length !== 10 || isNaN(Number(patientMobile.trim()))) {
      alert('Please enter a valid 10-digit patient mobile number.');
      return;
    }
    if (!selectedCategory) {
      alert('Please select a treatment category.');
      return;
    }
    if (!selectedDoctor) {
      alert('Please select a doctor.');
      return;
    }
    if (!selectedTime) {
      alert('Please select a timing slot.');
      return;
    }

    try {
      setSubmittingCreate(true);

      const creatorSuffix = 'Admin';
      const whatsappPayload = whatsapp.trim() ? `${whatsapp.trim()}|${creatorSuffix}` : `|${creatorSuffix}`;

      const [y, m, d] = appointmentDate.split('-');
      const formattedDate = `${d}/${m}/${y}`;

      const payload = {
        patient_name: patientName.trim(),
        patient_age: age.trim(),
        patient_gender: gender,
        whatsapp_number: whatsappPayload,
        login_mobile: patientMobile.trim(),
        treatment_category: selectedCategory.originalName,
        doctor_name: selectedDoctor.name,
        appointment_date: formattedDate,
        appointment_time: selectedTime,
        video_call: isVideoCall ? 'Yes' : 'No'
      };

      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/emails/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Appointment created successfully!');
        setIsCreateModalOpen(false);
        // Reset states
        setPatientName('');
        setAge('');
        setGender('Male');
        setWhatsapp('');
        setPatientMobile('');
        setSelectedCategory(null);
        setSelectedDoctor(null);
        setAppointmentDate('');
        setSelectedTime('');
        setIsVideoCall(false);
        setSelectedPatientValue('');
        // Refresh list
        fetchAppointmentsAndDoctors();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Failed to create appointment.');
      }
    } catch (error) {
      console.error('Submit Error:', error);
      alert('Submission failed.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  return (
    <div className="patient-appointments-container">
      {!isCreateModalOpen ? (
        <>
          <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '15px', flexWrap: 'wrap' }}>
            <h2>Patient Appointments</h2>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none', color: '#4b5563' }}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', width: '250px', outline: 'none' }}
              />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#5F76FE',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5F76FE'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#5F76FE'}
              >
                <FaPlus style={{ fontSize: '12px' }} /> Create Appointment
              </button>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <p className="loading-text">Loading appointments...</p>
            ) : (
              <>
                <table className="appointments-table">
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
                    {paginatedAppointments.length > 0 ? paginatedAppointments.map((appt) => (
                      <tr key={appt.id || appt._id}>
                        <td>{(appt.id || appt._id).slice(-6).toUpperCase()}</td>
                        <td>{appt.patient_name}</td>
                        <td>{removeTamil(appt.doctor_name)}</td>
                        <td>{appt.appointment_date ? appt.appointment_date.replace(/\s+/g, '') : ''}</td>
                        <td>{formatTimeSlot(appt.appointment_time)}</td>
                        <td>
                          <span className={`status-badge ${(appt.status || 'Pending').toLowerCase()}`}>
                            {appt.status || 'Pending'}
                          </span>
                        </td>
                        <td>
                          <button className="view-btn" onClick={() => handleView(appt)}>
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="text-center">No appointments found</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredAppointments.length}
                  itemsPerPage={itemsPerPage}
                />
              </>
            )}
          </div>
        </>
      ) : (
        <div className="create-appointment-inline-container">
          <div className="form-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
            <h2 style={{ color: '#000000ff', margin: 0, fontSize: '24px', fontWeight: '600' }}>Booking Appointment</h2>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              Back to List
            </button>
          </div>
          <form onSubmit={handleCreateSubmit}>
            <div className="modal-body-grid" style={{ padding: 0 }}>
              {/* Left Side: Patient Details */}
              <div className="detail-column">
                <h4 className="column-title">Patient Details</h4>

                <div className="form-group" ref={patientDropdownRef}>
                  <label className="form-label">Select Registered Patient (Optional)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="searchable-dropdown-container" style={{ flex: 1 }}>
                      <button
                        type="button"
                        className={`searchable-dropdown-trigger ${isPatientDropdownOpen ? 'open' : ''}`}
                        onClick={() => {
                          setIsPatientDropdownOpen(!isPatientDropdownOpen);
                          setPatientSearchQuery('');
                        }}
                      >
                        <span>
                          {selectedPatientValue
                            ? (registeredPatients.find(p => p.value === selectedPatientValue)?.label || selectedPatientValue)
                            : '-- Registered Patient / Search --'}
                        </span>
                        <span className="arrow-icon">▼</span>
                      </button>

                      {isPatientDropdownOpen && (
                        <div className="searchable-dropdown-menu">
                          <div className="searchable-dropdown-search-wrapper">
                            <input
                              type="text"
                              className="searchable-dropdown-search-input"
                              placeholder="Search Patient Name and Number"
                              value={patientSearchQuery}
                              onChange={(e) => setPatientSearchQuery(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <ul className="searchable-dropdown-options-list">
                            {registeredPatients.filter(p =>
                              p.label.toLowerCase().includes(patientSearchQuery.toLowerCase())
                            ).length > 0 ? (
                              registeredPatients.filter(p =>
                                p.label.toLowerCase().includes(patientSearchQuery.toLowerCase())
                              ).map(p => (
                                <li
                                  key={p.value}
                                  className={`searchable-dropdown-option ${selectedPatientValue === p.value ? 'selected' : ''}`}
                                  onClick={() => {
                                    handlePatientSelect({ target: { value: p.value } });
                                    setIsPatientDropdownOpen(false);
                                  }}
                                >
                                  {p.label}
                                </li>
                              ))
                            ) : (
                              <li className="searchable-dropdown-no-results">No patients found</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    {selectedPatientValue && (
                      <button
                        type="button"
                        onClick={handleClearPatientSelect}
                        className="clear-patient-btn"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Patient Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Age *</label>
                    <input
                      type="text"
                      value={age}
                      onChange={(e) => setAge(e.target.value.slice(0, 3))}
                      placeholder="00"
                      className="form-input"
                      style={{ textAlign: 'center' }}
                      maxLength="3"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Gender *</label>
                    <div className="gender-btn-group">
                      <button
                        type="button"
                        className={`gender-btn ${gender === 'Male' ? 'active' : ''}`}
                        onClick={() => setGender('Male')}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        className={`gender-btn ${gender === 'Female' ? 'active' : ''}`}
                        onClick={() => setGender('Female')}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">WhatsApp No</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="WhatsApp"
                      className="form-input"
                      maxLength="10"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Patient Mobile *</label>
                    <input
                      type="text"
                      value={patientMobile}
                      onChange={(e) => setPatientMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Mobile"
                      className="form-input"
                      maxLength="10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Right Side: Appointment Details */}
              <div className="detail-column">
                <h4 className="column-title">Appointment Details</h4>

                <div className="form-group">
                  <label className="form-label">Select Appointment Date *</label>
                  <DatePicker
                    selected={appointmentDate ? (() => {
                      const [y, m, d] = appointmentDate.split('-');
                      return new Date(Number(y), Number(m) - 1, Number(d));
                    })() : null}
                    onChange={(date) => {
                      if (date) {
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const d = String(date.getDate()).padStart(2, '0');
                        setAppointmentDate(`${y}-${m}-${d}`);
                      } else {
                        setAppointmentDate('');
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    filterDate={(date) => {
                      if (!date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const checkDate = new Date(date);
                      checkDate.setHours(0, 0, 0, 0);

                      if (checkDate < today) return false;

                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, '0');
                      const d = String(date.getDate()).padStart(2, '0');
                      const formattedStr = `${y}-${m}-${d}`;
                      return getAvailableDates().includes(formattedStr);
                    }}
                    dayClassName={(date) => {
                      if (!date) return '';
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, '0');
                      const d = String(date.getDate()).padStart(2, '0');
                      const formattedStr = `${y}-${m}-${d}`;

                      const hasSchedule = getAvailableDates().includes(formattedStr);
                      if (hasSchedule) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const checkDate = new Date(date);
                        checkDate.setHours(0, 0, 0, 0);

                        if (checkDate < today) {
                          return 'past-scheduled-day';
                        }
                        return 'scheduled-day';
                      }
                      return '';
                    }}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    placeholderText="DD/MM/YYYY"
                    customInput={<CustomDateInput placeholder="DD/MM/YYYY" />}
                    required
                  />
                </div>

                <div className="form-group" ref={categoryDropdownRef}>
                  <label className="form-label">Select Treatment Category *</label>
                  <div className="searchable-dropdown-container">
                    <button
                      type="button"
                      className={`searchable-dropdown-trigger ${isCategoryDropdownOpen ? 'open' : ''}`}
                      onClick={() => {
                        if (!appointmentDate) return;
                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                        setCategorySearchQuery('');
                      }}
                      disabled={!appointmentDate}
                    >
                      <span>
                        {selectedCategory
                          ? selectedCategory.name
                          : (appointmentDate ? '-- Choose Category --' : 'Select date first')}
                      </span>
                      <span className="arrow-icon">▼</span>
                    </button>

                    {isCategoryDropdownOpen && (
                      <div className="searchable-dropdown-menu">
                        <div className="searchable-dropdown-search-wrapper">
                          <input
                            type="text"
                            className="searchable-dropdown-search-input"
                            placeholder="select treatment category"
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <ul className="searchable-dropdown-options-list">
                          {doctorCategories.filter(cat =>
                            cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                          ).length > 0 ? (
                            doctorCategories.filter(cat =>
                              cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                            ).map(cat => (
                              <li
                                key={cat._id}
                                className={`searchable-dropdown-option ${selectedCategory && selectedCategory._id === cat._id ? 'selected' : ''}`}
                                onClick={() => {
                                  handleCategoryChange({ target: { value: cat._id } });
                                  setIsCategoryDropdownOpen(false);
                                }}
                              >
                                {cat.name}
                              </li>
                            ))
                          ) : (
                            <li className="searchable-dropdown-no-results">No categories found</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <input
                    type="hidden"
                    value={selectedCategory ? selectedCategory._id : ''}
                    required
                  />
                </div>

                <div className="form-group" ref={doctorDropdownRef}>
                  <label className="form-label">Select Doctor *</label>
                  <div className="searchable-dropdown-container">
                    <button
                      type="button"
                      className={`searchable-dropdown-trigger ${isDoctorDropdownOpen ? 'open' : ''}`}
                      onClick={() => {
                        if (!selectedCategory) return;
                        setIsDoctorDropdownOpen(!isDoctorDropdownOpen);
                        setDoctorSearchQuery('');
                      }}
                      disabled={!selectedCategory}
                    >
                      <span>
                        {selectedDoctor
                          ? selectedDoctor.name
                          : (selectedCategory ? '-- Choose Doctor --' : 'Select category first')}
                      </span>
                      <span className="arrow-icon">▼</span>
                    </button>

                    {isDoctorDropdownOpen && (
                      <div className="searchable-dropdown-menu">
                        <div className="searchable-dropdown-search-wrapper">
                          <input
                            type="text"
                            className="searchable-dropdown-search-input"
                            placeholder="select doctor"
                            value={doctorSearchQuery}
                            onChange={(e) => setDoctorSearchQuery(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <ul className="searchable-dropdown-options-list">
                          {doctorList.filter(doc =>
                            doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase())
                          ).length > 0 ? (
                            doctorList.filter(doc =>
                              doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase())
                            ).map(doc => (
                              <li
                                key={doc._id}
                                className={`searchable-dropdown-option ${selectedDoctor && selectedDoctor._id === doc._id ? 'selected' : ''}`}
                                onClick={() => {
                                  handleDoctorChange({ target: { value: doc._id } });
                                  setIsDoctorDropdownOpen(false);
                                }}
                              >
                                {doc.name}
                              </li>
                            ))
                          ) : (
                            <li className="searchable-dropdown-no-results">No doctors found</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <input
                    type="hidden"
                    value={selectedDoctor ? selectedDoctor._id : ''}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Available Timing Slots *</label>
                  {availableTimings.length > 0 ? (
                    <div className="timings-grid">
                      {availableTimings.map((time, index) => {
                        const bookedTimingsForCurrentDoctor = selectedDoctor ? (bookedByDoctor[selectedDoctor.name] || []) : [];
                        const timeTrim = time.trim();
                        let isBooked = bookedTimingsForCurrentDoctor.includes(timeTrim);

                        if (!isBooked) {
                          const startMins = parseTimeStringToMinutes(timeTrim.split(/to|\-/)[0].trim());
                          isBooked = bookedTimingsForCurrentDoctor.some(booked => {
                            const bookedMins = parseTimeStringToMinutes(booked);
                            return bookedMins !== -1 && startMins !== -1 && bookedMins === startMins;
                          });
                        }
                        const isSelected = selectedTime === time;

                        return (
                          <button
                            key={index}
                            type="button"
                            className={`timing-card-btn ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              if (isBooked) return;
                              setSelectedTime(isSelected ? '' : time);
                            }}
                            disabled={isBooked}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isBooked}
                              readOnly
                              className="slot-checkbox"
                            />
                            <span>{time.split(/to|\-/i)[0].trim()}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="no-timings-text">No timings available for selected date/doctor.</p>
                  )}
                </div>

                {/* <div className="form-group checkbox-group" onClick={() => setIsVideoCall(!isVideoCall)}>
                  <input
                    type="checkbox"
                    checked={isVideoCall}
                    onChange={() => { }}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>Video Call Consult</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Request video consultation</div>
                  </div>
                </div> */}
              </div>
            </div>
            <div className="modal-footer-actions" style={{ padding: '20px 0 0 0', borderTop: '1px solid #e5e7eb', marginTop: '20px' }}>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="confirm-btn"
                disabled={submittingCreate}
              >
                {submittingCreate ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isModalOpen && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header" style={{ flexDirection: 'column', alignItems: 'flex-start', position: 'relative', borderBottom: '1px solid #586ff5' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#586ff5', letterSpacing: '0.1em', marginBottom: '4px', textTransform: 'uppercase' }}>
                BOOKING • {(selectedAppointment.id || selectedAppointment._id).slice(-6).toUpperCase()}
              </span>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>Appointment details</h3>
              <button className="close-btn" onClick={closeModal} style={{ position: 'absolute', right: '25px', top: '25px' }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body-grid">
              {/* Left Side: Doctor Details */}
              <div className="detail-column">
                <h4 className="column-title">DOCTOR</h4>
                {(() => {
                  const doctor = doctors.find(d => d.doctorName === selectedAppointment.doctor_name);
                  if (doctor) {
                    return (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">Name</span>
                          <span className="detail-value">{removeTamil(doctor.doctorName)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Gender</span>
                          <span className="detail-value">{doctor.gender || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Experience</span>
                          <span className="detail-value">{doctor.experience ? `${doctor.experience} years` : 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Mobile</span>
                          <span className="detail-value">{doctor.mobile || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Email</span>
                          <span className="detail-value">{doctor.email || 'N/A'}</span>
                        </div>
                        <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: 'none', marginTop: '10px' }}>
                          <span className="detail-label" style={{ marginBottom: '8px' }}>Department</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', width: '100%' }}>
                            {(doctor.department || '').split(',').map((dep, idx) => {
                              const cleanDep = removeTamil(dep.trim());
                              if (!cleanDep) return null;
                              return (
                                <span key={idx} className="dept-tag-badge">
                                  {cleanDep}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    );
                  } else {
                    return (
                      <div className="detail-row">
                        <span className="detail-label">Name</span>
                        <span className="detail-value">{removeTamil(selectedAppointment.doctor_name)}</span>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Right Side: Patient & Appointment Details */}
              <div className="detail-column">
                <h4 className="column-title">PATIENT & APPOINTMENT</h4>
                <div className="detail-row">
                  <span className="detail-label">Patient</span>
                  <span className="detail-value">{selectedAppointment.patient_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Age / gender</span>
                  <span className="detail-value">
                    {selectedAppointment.patient_age || 'N/A'} / {selectedAppointment.patient_gender || 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">WhatsApp</span>
                  <span className="detail-value">
                    {selectedAppointment.whatsapp_number && /^\d+$/.test(selectedAppointment.whatsapp_number.replace(/\s+/g, ''))
                      ? selectedAppointment.whatsapp_number
                      : 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Login mobile</span>
                  <span className="detail-value">{selectedAppointment.login_mobile || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {selectedAppointment.appointment_date ? selectedAppointment.appointment_date.replace(/\s+/g, '') : ''}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{formatTimeSlot(selectedAppointment.appointment_time)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Video call</span>
                  <span className="detail-value">{selectedAppointment.video_call || 'No'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Follow up date</span>
                  <span className="detail-value">
                    {selectedAppointment.followup_date ? selectedAppointment.followup_date : 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Consulting Fee</span>
                  <span className="detail-value">
                    {selectedAppointment.consultingFee && parseFloat(selectedAppointment.consultingFee) > 0 ? `₹${selectedAppointment.consultingFee}` : 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Type</span>
                  <span className="detail-value">{selectedAppointment.paymentType || 'Offline'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Status</span>
                  <span className="detail-value">{selectedAppointment.paymentStatus || 'Pending'}</span>
                </div>


                <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                  {(() => {
                    const statusVal = String(selectedAppointment.status || 'Pending').toLowerCase();
                    const statusColor =
                      statusVal === 'approved' || statusVal === 'confirmed'
                        ? '#10b981'
                        : statusVal === 'pending'
                        ? '#f59e0b'
                        : statusVal === 'cancelled' || statusVal === 'cancel'
                        ? '#ef4444'
                        : '#6b7280';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor, display: 'inline-block' }}></span>
                        <span style={{ fontWeight: '700', color: statusColor, textTransform: 'capitalize', fontSize: '14px' }}>
                          {selectedAppointment.status || 'Pending'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="modal-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 25px', borderTop: '1px solid #e5e7eb' }}>
              <button
                type="button"
                className="confirm-btn"
                onClick={closeModal}
                style={{ backgroundColor: '#586ff5', color: '#ffffff', borderColor: '#586ff5', borderRadius: '6px', padding: '10px 20px', fontWeight: '600' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;

