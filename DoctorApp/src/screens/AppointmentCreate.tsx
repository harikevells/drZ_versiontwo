import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { Dropdown } from 'react-native-element-dropdown';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const parseTimeStringToMinutes = (timeStr: string) => {
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

const tamilTranslations: Record<string, string> = {
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

export default function AppointmentCreate() {
  const navigation = useNavigation<any>();

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [whatsapp, setWhatsapp] = useState('');
  const [patientMobile, setPatientMobile] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [date, setDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [creatorDoctorName, setCreatorDoctorName] = useState<string>('');

  // Lists & Dropdowns
  const [registeredPatients, setRegisteredPatients] = useState<any[]>([]);
  const [selectedPatientValue, setSelectedPatientValue] = useState<string | null>(null);
  const [doctorCategories, setDoctorCategories] = useState<any[]>([]);
  const [doctorList, setDoctorList] = useState<any[]>([]);
  const [availableTimings, setAvailableTimings] = useState<string[]>([]);
  const [bookedByDoctor, setBookedByDoctor] = useState<Record<string, string[]>>({});
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});

  // Dropdown UI Focus States
  const [isPatientFocus, setIsPatientFocus] = useState(false);
  const [isCategoryFocus, setIsCategoryFocus] = useState(false);
  const [isDoctorFocus, setIsDoctorFocus] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Temp Data States
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [availableDoctorsForDate, setAvailableDoctorsForDate] = useState<any[]>([]);
  const [dateSchedules, setDateSchedules] = useState<any[]>([]);

  const formatDate = (rawDate: Date) => {
    const d = new Date(rawDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  const fetchPatientsAndInitialDates = async () => {
    try {
      setLoading(true);
      const [apptRes, schedulesRes, doctorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/emails/all-appointments`),
        axios.get(`${API_BASE_URL}/schedules`),
        axios.get(`${API_BASE_URL}/doctors`)
      ]);

      const allAppts = apptRes.data || [];
      const allSchedules = schedulesRes.data || [];
      const liveDoctorsData = doctorsRes.data || [];

      setAllDoctors(liveDoctorsData);

      // Load creator doctor name
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const parsed = JSON.parse(stored);
        let name = parsed.doctorName || '';
        if (!name && parsed.email && liveDoctorsData.length > 0) {
          const fullProfile = liveDoctorsData.find((d: any) => d.email && d.email.toLowerCase() === parsed.email.toLowerCase());
          if (fullProfile && fullProfile.doctorName) {
            name = fullProfile.doctorName;
          }
        }
        setCreatorDoctorName(name);
      }

      // Extract unique patients from previous appointments list
      const patientMap = new Map();
      allAppts.forEach((app: any) => {
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

      // Calendar Marked Dates Setup
      const approvedSchedules = allSchedules.filter((s: any) => s.status === 'Approved');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const marked: Record<string, any> = {};
      // Disable past 30 days and next 90 days by default
      for (let i = -30; i < 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        marked[dateStr] = { disabled: true, disableTouchEvent: true };
      }

      approvedSchedules.forEach((s: any) => {
        if (s.date) {
          const scheduleDate = new Date(s.date);
          scheduleDate.setHours(0, 0, 0, 0);
          if (scheduleDate >= today) {
            const dateStr = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getDate()).padStart(2, '0')}`;
            marked[dateStr] = { disabled: false };
          }
        }
      });
      setMarkedDates(marked);

      // Select first available date or today
      const availableDates = Object.keys(marked).filter(k => marked[k] && !marked[k].disabled);
      if (availableDates.length > 0) {
        setDate(new Date(availableDates[0]));
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load initial data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulesForDate = async (selectedDate: Date) => {
    try {
      const d = new Date(selectedDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formattedDateForSchedules = `${year}-${month}-${day}`;
      const formattedDateForAppointments = formatDate(selectedDate);

      const [schedulesRes, appointmentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/schedules?date=${formattedDateForSchedules}`),
        axios.get(`${API_BASE_URL}/emails/booked-timings?appointment_date=${encodeURIComponent(formattedDateForAppointments)}&_t=${Date.now()}`)
      ]);

      const approvedSchedules = (schedulesRes.data || []).filter((s: any) => {
        if (s.status !== 'Approved') return false;
        return allDoctors.some((doc: any) => doc._id === s.doctorId || doc.id === s.doctorId || doc.doctorName === s.doctorName);
      });
      setDateSchedules(approvedSchedules);

      const appointments = appointmentsRes.data || [];
      const bookedMap: Record<string, string[]> = {};
      appointments.forEach((app: any) => {
        if (!['Pending', 'Approved', 'Rescheduled'].includes(app.status)) return;
        const docName = (app.doctor_name || '').trim();
        if (!bookedMap[docName]) bookedMap[docName] = [];
        bookedMap[docName].push((app.appointment_time || '').trim());
      });
      setBookedByDoctor(bookedMap);

      const activeDocs = allDoctors.filter((doc: any) =>
        approvedSchedules.some((s: any) => s.doctorId === doc._id || s.doctorId === doc.id || s.doctorName === doc.doctorName)
      );
      setAvailableDoctorsForDate(activeDocs);

      const uniqueDepts = new Set<string>();
      activeDocs.forEach((doc: any) => {
        if (doc.department) {
          doc.department.split(',').forEach((dep: string) => {
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
    } catch (error) {
      console.error('Error fetching schedules for date:', error);
    }
  };

  useEffect(() => {
    const loadCreatorDoctorName = async () => {
      try {
        const stored = await AsyncStorage.getItem('userData');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.doctorName) {
            setCreatorDoctorName(parsed.doctorName);
          }
        }
      } catch (e) {
        console.error('Failed to load doctorName from AsyncStorage', e);
      }
    };
    loadCreatorDoctorName();
    fetchPatientsAndInitialDates();
  }, []);

  useEffect(() => {
    if (allDoctors.length > 0) {
      fetchSchedulesForDate(date);
    }
  }, [date, allDoctors]);

  useEffect(() => {
    if (selectedDoctor) {
      const schedulesForDoctor = dateSchedules.filter((s: any) =>
        s.doctorId === selectedDoctor._id ||
        s.doctorId === selectedDoctor.id ||
        s.doctorName === selectedDoctor.name
      );

      if (schedulesForDoctor.length > 0) {
        const allTimings = schedulesForDoctor.flatMap((s: any) => s.time || []);
        let uniqueTimings = Array.from(new Set(allTimings));

        const today = new Date();
        const d = new Date(date);
        const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
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
    setSelectedTimes([]);
  }, [selectedDoctor, dateSchedules]);

  const handlePatientSelect = (item: any) => {
    setSelectedPatientValue(item.value);
    setPatientName(item.name);
    setAge(item.age);
    setGender(item.gender);
    setWhatsapp(item.whatsapp);
    setPatientMobile(item.mobile);
  };

  const handleClearPatientSelect = () => {
    setSelectedPatientValue(null);
    setPatientName('');
    setAge('');
    setGender('Male');
    setWhatsapp('');
    setPatientMobile('');
  };

  const handleSubmit = async () => {
    if (!patientName.trim()) {
      Alert.alert('Validation Error', 'Please enter patient name.');
      return;
    }
    if (!age.trim() || isNaN(Number(age))) {
      Alert.alert('Validation Error', 'Please enter a valid age.');
      return;
    }
    if (!gender) {
      Alert.alert('Validation Error', 'Please select patient gender.');
      return;
    }
    if (whatsapp.trim() && (whatsapp.trim().length !== 10 || isNaN(Number(whatsapp.trim())))) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit WhatsApp number.');
      return;
    }
    if (!patientMobile.trim()) {
      Alert.alert('Validation Error', 'Please enter patient mobile number.');
      return;
    }
    if (patientMobile.trim().length !== 10 || isNaN(Number(patientMobile.trim()))) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit patient mobile number.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Validation Error', 'Please select a treatment category.');
      return;
    }
    if (!selectedDoctor) {
      Alert.alert('Validation Error', 'Please select a doctor.');
      return;
    }
    if (selectedTimes.length === 0) {
      Alert.alert('Validation Error', 'Please select a timing slot.');
      return;
    }

    try {
      setSubmitting(true);

      let creatorName = creatorDoctorName;
      if (!creatorName) {
        const stored = await AsyncStorage.getItem('userData');
        if (stored) {
          const parsed = JSON.parse(stored);
          creatorName = parsed.doctorName || '';
          if (!creatorName && parsed.email) {
            try {
              const res = await axios.get(`${API_BASE_URL}/doctors`);
              const liveDocs = res.data || [];
              const fullProfile = liveDocs.find((d: any) => d.email && d.email.toLowerCase() === parsed.email.toLowerCase());
              if (fullProfile && fullProfile.doctorName) {
                creatorName = fullProfile.doctorName;
              }
            } catch (err) {
              console.error('Failed to query doctor name fallback in submit', err);
            }
          }
        }
      }

      console.log('Final Creator Name for booking:', creatorName);
      const doctorSuffix = creatorName ? `Doctor:${creatorName}` : 'Doctor';
      const whatsappPayload = whatsapp.trim() ? `${whatsapp.trim()}|${doctorSuffix}` : `|${doctorSuffix}`;

      const payload = {
        patient_name: patientName.trim(),
        patient_age: age.trim(),
        patient_gender: gender,
        whatsapp_number: whatsappPayload,
        login_mobile: patientMobile.trim(),
        treatment_category: selectedCategory.originalName,
        doctor_name: selectedDoctor.name,
        appointment_date: formatDate(date),
        appointment_time: selectedTimes.join(', '),
        video_call: isVideoCall ? 'Yes' : 'No'
      };

      const response = await axios.post(`${API_BASE_URL}/emails/book`, payload);

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Appointment created successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to create appointment.');
      }
    } catch (error: any) {
      console.error('Submit Error:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D6EFD" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.blueTopBackground} />

      {/* Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Create Appointment</Text>
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Patient Selection Dropdown */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Select Registered Patient (Optional)</Text>
              {selectedPatientValue && (
                <TouchableOpacity onPress={handleClearPatientSelect} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="close-circle-outline" size={16} color="#FF3B30" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#FF3B30', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
            <Dropdown
              style={[styles.dropdown, isPatientFocus && { borderColor: '#0D6EFD' }]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              itemTextStyle={{ color: 'black' }}
              data={registeredPatients}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isPatientFocus ? 'Search registered patient...' : ' '}
              searchPlaceholder="Select Patient Name or Number"
              value={selectedPatientValue}
              onFocus={() => setIsPatientFocus(true)}
              onBlur={() => setIsPatientFocus(false)}
              onChange={item => {
                handlePatientSelect(item);
                setIsPatientFocus(false);
              }}
              renderLeftIcon={() => (
                <Ionicons name="person-outline" size={18} color="#666" style={{ marginRight: 8 }} />
              )}
            />
          </View>

          {/* Patient Name */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Patient Name *</Text>
            <TextInput
              style={styles.inputField}
              value={patientName}
              onChangeText={setPatientName}
              placeholder="Enter patient name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Age & Gender Row */}
          <View style={styles.rowLayout}>
            <View style={{ flex: 0.36 }}>
              <Text style={styles.inputLabel}>Age *</Text>
              <TextInput
                style={[styles.inputField, { textAlign: 'center' }]}
                value={age}
                onChangeText={setAge}
                placeholder="00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={{ flex: 0.60 }}>
              <Text style={styles.inputLabel}>Gender *</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'Male' && styles.genderBtnActive]}
                  onPress={() => setGender('Male')}
                >
                  <Ionicons name="male" size={16} color={gender === 'Male' ? '#FFF' : '#333'} />
                  <Text numberOfLines={1} style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'Female' && styles.genderBtnActive]}
                  onPress={() => setGender('Female')}
                >
                  <Ionicons name="female" size={16} color={gender === 'Female' ? '#FFF' : '#333'} />
                  <Text numberOfLines={1} style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* WhatsApp & Mobile Row */}
          <View style={styles.rowLayout}>
            <View style={{ flex: 0.48 }}>
              <Text style={styles.inputLabel}>WhatsApp No</Text>
              <TextInput
                style={styles.inputField}
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="WhatsApp"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={{ flex: 0.48 }}>
              <Text style={styles.inputLabel}>Patient Mobile *</Text>
              <TextInput
                style={styles.inputField}
                value={patientMobile}
                onChangeText={setPatientMobile}
                placeholder="Mobile"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Date Picker trigger */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Select Appointment Date *</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowCalendar(true)}
            >
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#0D6EFD" />
            </TouchableOpacity>
          </View>

          {/* Calendar Modal */}
          <Modal
            visible={showCalendar}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCalendar(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowCalendar(false)}
            >
              <View style={styles.calendarContainer}>
                <Calendar
                  minDate={new Date().toISOString().split('T')[0]}
                  markedDates={{
                    ...markedDates,
                    [`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`]: {
                      ...(markedDates[`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`] || {}),
                      selected: true,
                      selectedColor: '#0D6EFD',
                    }
                  }}
                  onDayPress={day => {
                    const dateStr = day.dateString;
                    if (markedDates[dateStr] && markedDates[dateStr].disabled) {
                      return;
                    }
                    setDate(new Date(day.timestamp));
                    setShowCalendar(false);
                  }}
                  theme={{
                    todayTextColor: '#0D6EFD',
                    arrowColor: '#0D6EFD',
                    textDayFontWeight: 'bold',
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Category Selection Dropdown */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Select Treatment Category *</Text>
            <Dropdown
              style={[styles.dropdown, isCategoryFocus && { borderColor: '#0D6EFD' }]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              itemTextStyle={{ color: 'black' }}
              data={doctorCategories.length === 0 ? [{ _id: '0', name: 'No categories available' }] : doctorCategories}
              search
              maxHeight={300}
              labelField="name"
              valueField="_id"
              placeholder={!isCategoryFocus ? 'Select Treatment Category...' : '...'}
              searchPlaceholder="Search category..."
              value={selectedCategory ? selectedCategory._id : null}
              onFocus={() => setIsCategoryFocus(true)}
              onBlur={() => setIsCategoryFocus(false)}
              onChange={item => {
                if (item._id === '0') return;
                setSelectedCategory(item);
                setIsCategoryFocus(false);

                // Filter Doctors
                const docsForCategory = availableDoctorsForDate.filter((doc: any) => {
                  if (!doc.department) return item.originalName === 'Others';
                  const depts = doc.department.split(',').map((cat: string) => cat.trim());
                  return depts.includes(item.fullDepartment);
                });

                const formattedDocs = docsForCategory.map((doc: any) => ({
                  _id: doc._id || doc.id,
                  name: doc.doctorName
                }));
                setDoctorList(formattedDocs);
                setSelectedDoctor(null);
              }}
              renderLeftIcon={() => (
                <Ionicons name="pulse" size={18} color="#666" style={{ marginRight: 8 }} />
              )}
            />
          </View>

          {/* Doctor Selection Dropdown */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Select Doctor *</Text>
            <Dropdown
              style={[styles.dropdown, isDoctorFocus && { borderColor: '#0D6EFD' }]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              itemTextStyle={{ color: 'black' }}
              data={doctorList.length === 0 ? [{ _id: '0', name: 'Select category first / No doctors' }] : doctorList}
              search
              maxHeight={300}
              labelField="name"
              valueField="_id"
              placeholder={!isDoctorFocus ? 'Select Doctor...' : '...'}
              searchPlaceholder="Search doctor..."
              value={selectedDoctor ? selectedDoctor._id : null}
              onFocus={() => setIsDoctorFocus(true)}
              onBlur={() => setIsDoctorFocus(false)}
              onChange={item => {
                if (item._id === '0') return;
                setSelectedDoctor(item);
                setIsDoctorFocus(false);
              }}
              renderLeftIcon={() => (
                <Ionicons name="medical-outline" size={18} color="#666" style={{ marginRight: 8 }} />
              )}
            />
          </View>

          {/* Timings Grid */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Available Timing Slots *</Text>
            {availableTimings.length > 0 ? (
              <View style={styles.timingsGrid}>
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

                  const isSelected = selectedTimes.includes(time);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timingCard,
                        isBooked && styles.timingCardBooked,
                        isSelected && styles.timingCardSelected
                      ]}
                      onPress={() => {
                        if (isBooked) return;
                        setSelectedTimes([time]); // select only one
                      }}
                      activeOpacity={isBooked ? 1 : 0.7}
                    >
                      {isBooked ? (
                        <Ionicons
                          name="checkbox"
                          size={16}
                          color="#F47171"
                          style={{ marginRight: 8 }}
                        />
                      ) : (
                        <Ionicons
                          name={isSelected ? "checkbox" : "square-outline"}
                          size={16}
                          color={isSelected ? "#2DC045" : "#ccc"}
                          style={{ marginRight: 8 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.timingText,
                          isBooked && styles.timingTextBooked,
                          isSelected && styles.timingTextSelected
                        ]}
                      >
                        {time.split(/to|\-/i)[0].trim()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noTimingsText}>No timings available for selected date/doctor.</Text>
            )}
          </View>

    

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { backgroundColor: '#888' }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Confirm Appointment</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  blueTopBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#0D6EFD',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    position: 'absolute',
    top: 85,
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    width: '95%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    padding: 5,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  rowLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 48,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems:'center',
    gap: 5,
    height: 48,
  },
  genderBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
  },
  genderBtnActive: {
    backgroundColor: '#0D6EFD',
    borderColor: '#0D6EFD',
  },
  genderText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    marginLeft: 6,
  },
  genderTextActive: {
    color: '#FFF',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 48,
    backgroundColor: '#FAFAFA',
  },
  dateText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  dropdown: {
    height: 48,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
  },
  placeholderStyle: {
    fontSize: 15,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 15,
    color: '#333',
  },
  inputSearchStyle: {
    fontSize: 15,
    color: '#333',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '600',
  },
  timingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  timingCard: {
    width: '30%',
    margin: '1.66%',
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: '#FAFAFA',
  },
  timingCardSelected: {
    backgroundColor: '#FFF',
    borderColor: '#0D6EFD',
    borderWidth: 1.5,
  },
  timingCardBooked: {
    backgroundColor: '#FADBD8',
    borderColor: '#F1948A',
  },
  timingText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  timingTextSelected: {
    color: '#0D6EFD',
    fontWeight: '700',
  },
  timingTextBooked: {
    color: '#C0392B',
    textDecorationLine: 'line-through',
  },
  noTimingsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FAFAFA',
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  videoSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#0D6EFD',
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 10,
    elevation: 5,
  },
});
