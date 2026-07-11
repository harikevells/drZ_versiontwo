import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

import { API_BASE_URL } from '../config';

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

const PatientAppointmentsScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const { texts } = useContext(LanguageContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const blinkAnim = React.useRef(new Animated.Value(1)).current;
  const flatListRef = React.useRef(null);
  const [blinkingAppointments, setBlinkingAppointments] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      setBlinkingAppointments([]);
      blinkAnim.setValue(1);
      blinkAnim.stopAnimation();
      navigation.setParams({ blinkMessage: null });
    }
  }, [isFocused]);

  useEffect(() => {
    if ((route?.params?.blinkBookingId || route?.params?.blinkMessage) && appointments.length > 0) {
      const bookingId = route.params.blinkBookingId;
      const msg = (route.params.blinkMessage || '').toLowerCase();

      const matchedItems = appointments.map((app, index) => {
        // First try to match strictly using Booking ID if available
        if (bookingId && (app._id === bookingId || app.id === bookingId || app.booking_id === bookingId)) {
          return { index, score: 100 };
        }

        // Since Booking ID is not sent by backend, use Doctor + Date + Time as a "Virtual Booking ID"
        const docName = String(app.doctor_name || app.doctor || '').toLowerCase();
        const appDate = String(app.appointment_date || app.appointmentDate || '').toLowerCase();
        const appTime = String(app.appointment_time || app.appointmentTime || '').toLowerCase();
        const appStatus = String(app.status || '').toLowerCase();

        let score = 0;
        if (docName && msg.includes(docName)) score += 1;
        if (appDate && msg.includes(appDate)) score += 1;
        if (appTime && msg.includes(appTime)) score += 1;
        
        // Tie-breaker: Match the status! This prevents the wrong card from blinking.
        if (appStatus && msg.includes(appStatus)) score += 5;

        return { index, score };
      }).filter(item => item.score >= 2).sort((a, b) => b.score - a.score);

      if (matchedItems.length > 0) {
        const targetIndex = matchedItems[0].index;
        setBlinkingAppointments([targetIndex]);
        
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index: targetIndex,
              animated: true,
              viewPosition: 0.5 // Centers the card
            });
          }
        }, 500);

        Animated.loop(
          Animated.sequence([
            Animated.timing(blinkAnim, {
              toValue: 0.3,
              duration: 500,
              useNativeDriver: true
            }),
            Animated.timing(blinkAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true
            })
          ])
        ).start();

        navigation.setParams({ blinkMessage: undefined });

        const timer = setTimeout(() => {
          setBlinkingAppointments([]);
          blinkAnim.setValue(1);
          blinkAnim.stopAnimation();
        }, 5000);

        return () => {
          clearTimeout(timer);
          blinkAnim.stopAnimation();
        };
      }
    }
  }, [route?.params?.blinkMessage, appointments]);

  const handleStopBlink = (index) => {
    if (blinkingAppointments.includes(index)) {
      setBlinkingAppointments(prev => prev.filter(id => id !== index));
      if (blinkingAppointments.length <= 1) {
        blinkAnim.setValue(1);
        blinkAnim.stopAnimation();
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
    } else {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const mobile = user?.contactNumber || user?.mobile;
      if (!mobile) {
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/emails/patient-appointments/${mobile}`);

      if (response.data && Array.isArray(response.data)) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const DetailRow = ({ label, value, isBold = false, icon }) => (
    <View style={styles.detailRow}>
      <View style={styles.labelContainer}>
        {icon && <Icon name={icon} size={16} color="#5F76FE" style={{ marginRight: 6 }} />}
        <Text style={styles.detailLabel}>{label} : </Text>
      </View>
      <Text style={[styles.detailValue, isBold && { fontWeight: 'bold', color: '#1C3E55' }]}>
        {value || "N/A"}
      </Text>
    </View>
  );

  const renderAppointment = ({ item, index }) => {
    const isBlinking = blinkingAppointments.includes(index);
    return (
      <TouchableOpacity activeOpacity={1} onPress={() => handleStopBlink(index)}>
        <Animated.View style={[styles.card, isBlinking && { borderColor: '#5F76FE', borderWidth: 2 }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="doctor" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.cardTitle}>{item.doctor_name || item.doctor || 'Doctor'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'Cancelled' ? '#FF4B4B' : item.status === 'Completed' ? '#32CD32' : '#FF9800' }]}>
              <Text style={styles.statusText}>{item.status || "Pending"}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <DetailRow icon="account" label="Patient/நோயாளி" value={item.patient_name || "N/A"} />
            <DetailRow icon="calendar" label="Date/தேதி" value={item.appointment_date || item.appointmentDate} />
            <DetailRow icon="clock-outline" label="Time/நேரம்" value={formatTimeSlot(item.appointment_time || item.appointmentTime)} />
            <DetailRow icon="hospital-building" label="Category/பிரிவு" value={item.treatment_category || 'N/A'} />
            <DetailRow icon="video" label="Video Call/வீடியோ" value={item.video_call || 'No'} />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={require('../assets/user.png')} style={styles.userImage} />
          <View style={styles.textContainer}>
            <Text style={styles.greeting}>{texts?.greeting || 'Hi'} {user?.name || "Patient"},</Text>
            <Text style={styles.subGreeting}>My Appointments / எனது முன்பதிவுகள்</Text>
          </View>
        </View>
      </View>

      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#5F76FE" style={{ marginTop: 50 }} />
        ) : appointments.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={appointments}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderAppointment}
            contentContainerStyle={{ paddingBottom: 10 }}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
              });
            }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="calendar-remove" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No appointments found / முன்பதிவுகள் இல்லை</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userImage: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#eee', marginRight: 12 },
  textContainer: { justifyContent: 'center' },
  greeting: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  subGreeting: { fontSize: 13, color: '#5F76FE', fontWeight: 'bold', marginTop: 2 },

  container: { flex: 1, padding: 25, paddingBottom: 70 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#eee'
  },
  cardHeader: {
    backgroundColor: '#5F76FE',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start'
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%'
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666'
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500'
  },
  extraSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  extraTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C3E55',
    marginBottom: 5
  },
  extraText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
    paddingLeft: 5
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 15,
    fontWeight: '500'
  }
});

export default PatientAppointmentsScreen;
