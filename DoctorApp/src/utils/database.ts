import SQLite from 'react-native-sqlite-storage';
import { DOCTOR_EMAIL, DOCTOR_NAME, DOCTOR_DEPARTMENT, DOCTOR_MOBILE, DOCTOR_EXPERIENCE, DOCTOR_GENDER } from '@env';

SQLite.enablePromise(true);

const database_name = "DoctorApp.db";
const database_version = "1.0";
const database_displayname = "Doctor SQLite Database";
const database_size = 200000;

let db: any;

export const initDB = async () => {
  try {
    db = await SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size
    );
    
    // Create Tables
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS Appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT,
        doctor_name TEXT,
        appointment_date TEXT,
        appointment_time TEXT,
        treatment_category TEXT,
        patient_gender TEXT,
        status TEXT
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS Notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_name TEXT,
        title TEXT,
        message TEXT,
        createdAt TEXT,
        isRead INTEGER DEFAULT 0
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS PatientNotifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login_mobile TEXT,
        title TEXT,
        message TEXT,
        createdAt TEXT,
        isRead INTEGER DEFAULT 0
      );
    `);

    try {
      await db.executeSql('ALTER TABLE Appointments ADD COLUMN login_mobile TEXT');
    } catch(e) { /* Column might already exist */ }

    try {
      await db.executeSql('ALTER TABLE Appointments ADD COLUMN createdAt TEXT');
    } catch(e) { /* Column might already exist */ }

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS Doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctorName TEXT,
        email TEXT,
        department TEXT,
        mobile TEXT,
        experience TEXT,
        gender TEXT
      );
    `);

    // Removed dummy static data for Appointments and Notifications

    const [doctors] = await db.executeSql('SELECT COUNT(*) as count FROM Doctors');
    if (doctors.rows.item(0).count === 0) {
      await db.executeSql(
        `INSERT INTO Doctors (doctorName, email, department, mobile, experience, gender) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          DOCTOR_NAME || 'Dr. John Doe', 
          DOCTOR_EMAIL || 'doctor@drz.com', 
          DOCTOR_DEPARTMENT || 'Cardiology', 
          DOCTOR_MOBILE || '1234567890', 
          DOCTOR_EXPERIENCE || '10', 
          DOCTOR_GENDER || 'Male'
        ]
      );
    } else {
      // Always keep it synced with env if there's only one main doctor
      await db.executeSql(
        `UPDATE Doctors SET doctorName=?, email=?, department=?, mobile=?, experience=?, gender=?`,
        [
          DOCTOR_NAME || 'Dr. John Doe', 
          DOCTOR_EMAIL || 'doctor@drz.com', 
          DOCTOR_DEPARTMENT || 'Cardiology', 
          DOCTOR_MOBILE || '1234567890', 
          DOCTOR_EXPERIENCE || '10', 
          DOCTOR_GENDER || 'Male'
        ]
      );
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("DB Initialization Error:", error);
  }
};

export const deleteOldData = async () => {
  if (!db) await initDB();
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  await db.executeSql('DELETE FROM Appointments WHERE createdAt IS NULL OR createdAt < ?', [fiveMinsAgo]);
  await db.executeSql('DELETE FROM Notifications WHERE createdAt IS NULL OR createdAt < ?', [fiveMinsAgo]);
  await db.executeSql('DELETE FROM PatientNotifications WHERE createdAt IS NULL OR createdAt < ?', [fiveMinsAgo]);
};

export const getDashboardData = async (doctorName: string) => {
  if (!db) await initDB();
  await deleteOldData();
  
  const [appointmentsRes] = await db.executeSql('SELECT * FROM Appointments WHERE doctor_name = ?', [doctorName]);
  
  const allAppointments = [];
  for (let i = 0; i < appointmentsRes.rows.length; i++) {
    allAppointments.push(appointmentsRes.rows.item(i));
  }

  const todayStr = new Date().toISOString().split('T')[0]; // simple today comparison

  const todaysAppointments = allAppointments.filter((a: any) => a.appointment_date === todayStr).length;
  const pendingAppointments = allAppointments.filter((a: any) => a.status === 'Pending').length;
  const totalAttended = allAppointments.filter((a: any) => a.status === 'Completed').length;

  const patientRequests = allAppointments.filter((a: any) => a.status === 'Pending');
  const recentPatients = allAppointments.filter((a: any) => a.status === 'Completed' || a.status === 'Approved').slice(0, 5);

  return {
    stats: { todaysAppointments, pendingAppointments, totalAttended },
    patientRequests,
    recentPatients
  };
};

export const getAppointments = async (doctorName: string) => {
  if (!db) await initDB();
  await deleteOldData();
  const [res] = await db.executeSql('SELECT * FROM Appointments WHERE doctor_name = ? ORDER BY id DESC', [doctorName]);
  
  const appointments = [];
  for (let i = 0; i < res.rows.length; i++) {
    appointments.push(res.rows.item(i));
  }
  return appointments;
};

export const updateAppointmentStatus = async (id: string, status: string) => {
  if (!db) await initDB();
  await db.executeSql('UPDATE Appointments SET status = ? WHERE id = ?', [status, id]);
  
  // Create a patient notification
  const [res] = await db.executeSql('SELECT login_mobile, patient_name FROM Appointments WHERE id = ?', [id]);
  if (res.rows.length > 0) {
    const { login_mobile, patient_name } = res.rows.item(0);
    if (login_mobile) {
      const title = `Appointment ${status}`;
      const message = `Your appointment for ${patient_name} has been ${status.toLowerCase()}.`;
      await db.executeSql(
        'INSERT INTO PatientNotifications (login_mobile, title, message, createdAt, isRead) VALUES (?, ?, ?, ?, 0)',
        [login_mobile, title, message, new Date().toISOString()]
      );
    }
  }
  return true;
};

export const getNotifications = async (doctorName: string) => {
  if (!db) await initDB();
  await deleteOldData();
  const [res] = await db.executeSql('SELECT * FROM Notifications WHERE doctor_name = ? ORDER BY id DESC', [doctorName]);
  
  const notifications = [];
  for (let i = 0; i < res.rows.length; i++) {
    notifications.push(res.rows.item(i));
  }
  return notifications;
};

export const markNotificationAsRead = async (id: string) => {
  if (!db) await initDB();
  await db.executeSql('UPDATE Notifications SET isRead = 1 WHERE id = ?', [id]);
  return true;
};

export const markAllNotificationsAsRead = async (doctorName: string) => {
  if (!db) await initDB();
  await db.executeSql('UPDATE Notifications SET isRead = 1 WHERE doctor_name = ?', [doctorName]);
  return true;
};

export const getDoctorProfile = async (email: string) => {
  if (!db) await initDB();
  // Always fetch the primary local doctor record synced from .env
  const [res] = await db.executeSql('SELECT * FROM Doctors LIMIT 1');
  if (res.rows.length > 0) {
    return res.rows.item(0);
  }
  return null;
};

// --- PATIENT APP FUNCTIONS ---

export const getPatientAppointments = async (patientName: string) => {
  if (!db) await initDB();
  await deleteOldData();
  const [res] = await db.executeSql('SELECT * FROM Appointments WHERE patient_name = ? ORDER BY id DESC', [patientName]);
  
  const appointments = [];
  for (let i = 0; i < res.rows.length; i++) {
    appointments.push(res.rows.item(i));
  }
  return appointments;
};

export const bookAppointment = async (appointmentData: any) => {
  if (!db) await initDB();
  const { patient_name, doctor_name, appointment_date, appointment_time, treatment_category, patient_gender, login_mobile } = appointmentData;
  const now = new Date().toISOString();
  await db.executeSql(
    `INSERT INTO Appointments (patient_name, doctor_name, appointment_date, appointment_time, treatment_category, patient_gender, status, login_mobile, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
    [patient_name, doctor_name, appointment_date, appointment_time, treatment_category, patient_gender, login_mobile, now]
  );
  
  // Create a notification for the doctor
  await db.executeSql(
    `INSERT INTO Notifications (doctor_name, title, message, createdAt, isRead)
     VALUES (?, ?, ?, ?, 0)`,
    [doctor_name, 'New Appointment', `${patient_name} has requested an appointment.`, now]
  );
  
  // Also create a "Submitted" notification for the patient
  if (login_mobile) {
    await db.executeSql(
      `INSERT INTO PatientNotifications (login_mobile, title, message, createdAt, isRead)
       VALUES (?, ?, ?, ?, 0)`,
      [login_mobile, 'Appointment Submitted', `Your request for ${patient_name} was sent.`, now]
    );
  }
  
  return true;
};

export const getPatientNotifications = async (mobile: string) => {
  if (!db) await initDB();
  await deleteOldData();
  const [res] = await db.executeSql('SELECT * FROM PatientNotifications WHERE login_mobile = ? ORDER BY id DESC', [mobile]);
  const notifications = [];
  for (let i = 0; i < res.rows.length; i++) {
    notifications.push(res.rows.item(i));
  }
  return notifications;
};

export const markPatientNotificationsAsRead = async (mobile: string) => {
  if (!db) await initDB();
  await db.executeSql('UPDATE PatientNotifications SET isRead = 1 WHERE login_mobile = ?', [mobile]);
  return true;
};

export const clearAllDatabaseData = async () => {
  if (!db) await initDB();
  await db.executeSql('DELETE FROM Appointments');
  await db.executeSql('DELETE FROM Notifications');
  await db.executeSql('DELETE FROM PatientNotifications');
  // Add some default dummy data back so the app doesn't crash on empty states
  return true;
};

export const getAllDoctors = async () => {
  if (!db) await initDB();
  const [res] = await db.executeSql('SELECT * FROM Doctors');
  const doctors = [];
  for (let i = 0; i < res.rows.length; i++) {
    doctors.push(res.rows.item(i));
  }
  return doctors;
};

export const getAllAppointmentsForDate = async (date: string) => {
  if (!db) await initDB();
  await deleteOldData();
  const [res] = await db.executeSql('SELECT * FROM Appointments WHERE appointment_date = ?', [date]);
  const appointments = [];
  for (let i = 0; i < res.rows.length; i++) {
    appointments.push(res.rows.item(i));
  }
  return appointments;
};
