import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RescheduleModal from '../components/RescheduleModal';
import ApproveModal from '../components/ApproveModal';
import CompleteModal from '../components/CompleteModal';
import CancelModal from '../components/CancelModal';
import { useIsFocused, useNavigation } from '@react-navigation/native';

import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}/appointments`;

export default function AppointmentScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Completed' | 'Cancelled'>('Pending');
  const [doctorName, setDoctorName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [completeVisible, setCompleteVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const fetchAppointments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setDoctorName(user.doctorName);
        fetchUnreadCount(user.doctorName);
        const response = await axios.get(`${API_URL}/all/${encodeURIComponent(user.doctorName)}`);
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Could not load appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchAppointments(appointments.length === 0);
      if (doctorName) fetchUnreadCount(doctorName);
    }
  }, [isFocused, doctorName]);

  const fetchUnreadCount = async (name: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/doctor/${name}`);
      const count = response.data.filter((n: any) => !n.isRead).length;
      setUnreadCount(count);
    } catch (error) {
      console.log('Error fetching notification count:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.put(`${API_URL}/${id}/status`, { status });
      Alert.alert('Success', `Appointment ${status.toLowerCase()} successfully!`);
      fetchAppointments(false);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update appointment status.');
    }
  };

  const openCancel = (patient: any) => {
    setSelectedPatient(patient);
    setCancelVisible(true);
  };

  const openReschedule = (patient: any) => {
    setSelectedPatient(patient);
    setRescheduleVisible(true);
  };

  const openApprove = (patient: any) => {
    setSelectedPatient(patient);
    setApproveVisible(true);
  };

  const openComplete = (patient: any) => {
    setSelectedPatient(patient);
    setCompleteVisible(true);
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#666';
    switch (status.toLowerCase()) {
      case 'pending': return '#FDBA31'; // Yellow/Orange
      case 'approved': return '#2CD95C'; // Green
      case 'rescheduled': return '#0D6EFD'; // Blue
      case 'cancelled': return '#FF4C4C'; // Red
      case 'completed': return '#2CD95C'; // Green
      default: return '#666';
    }
  };

  const filteredAppointments = appointments.filter(app => {
    if (!app.status) return false;
    const s = app.status.toLowerCase();
    if (activeTab === 'Pending') {
      return s === 'pending' || s === 'rescheduled';
    }
    return s === activeTab.toLowerCase();
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#052A3F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.blueTopBackground} />
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Appointment List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationIconContainer} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#0D6EFD" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        
        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Pending' && styles.activeTabBtn]}
            onPress={() => setActiveTab('Pending')}
          >
            <Text style={[styles.tabText, activeTab === 'Pending' && styles.activeTabText]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Approved' && styles.activeTabBtn]}
            onPress={() => setActiveTab('Approved')}
          >
            <Text style={[styles.tabText, activeTab === 'Approved' && styles.activeTabText]}>Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Completed' && styles.activeTabBtn]}
            onPress={() => setActiveTab('Completed')}
          >
            <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Cancelled' && styles.activeTabBtn]}
            onPress={() => setActiveTab('Cancelled')}
          >
            <Text style={[styles.tabText, activeTab === 'Cancelled' && styles.activeTabText]}>Cancelled</Text>
          </TouchableOpacity>
        </View>

        {filteredAppointments.length === 0 ? (
          <Text style={styles.noData}>No {activeTab.toLowerCase()} appointments.</Text>
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={(item: any) => item.id || item._id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patientName}>{item.patient_name}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={[styles.detailText, { width: 90 }]}>{item.appointment_date}</Text>
                  <Ionicons name="time-outline" size={14} color="#666" style={{ marginLeft: 15 }} />
                  <Text style={[styles.detailText, { width: 150 }]}>{item.appointment_time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="medical-outline" size={14} color="#666" />
                  <Text style={[styles.detailText, { width: 280 }]}>{item.treatment_category || 'General'}</Text>
                </View>

                {activeTab === 'Pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.btn, styles.approveBtn]}
                      onPress={() => openApprove(item)}
                    >
                      <Text style={styles.btnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.btn, styles.rescheduleBtn]}
                      onPress={() => openReschedule(item)}
                    >
                      <Text style={styles.btnText}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.btn, styles.cancelBtn]}
                      onPress={() => openCancel(item)}
                    >
                      <Text style={styles.btnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeTab === 'Approved' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.btn, styles.completeBtn]}
                      onPress={() => openComplete(item)}
                    >
                      <Text style={styles.btnText}>Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.btn, styles.cancelBtn]}
                      onPress={() => openCancel(item)}
                    >
                      <Text style={styles.btnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Modals */}
      <RescheduleModal 
        visible={rescheduleVisible} 
        onClose={() => { setRescheduleVisible(false); fetchAppointments(false); }} 
        patientId={selectedPatient?.id || selectedPatient?._id}
        doctorName={doctorName}
      />
      <ApproveModal 
        visible={approveVisible} 
        onClose={() => setApproveVisible(false)} 
        onConfirm={() => {
          setApproveVisible(false);
          handleStatusUpdate(selectedPatient?.id || selectedPatient?._id, 'Approved');
        }}
        patientName={selectedPatient?.patient_name}
      />
      
      <CompleteModal 
        visible={completeVisible} 
        onClose={() => setCompleteVisible(false)} 
        onComplete={() => {
          setCompleteVisible(false);
          handleStatusUpdate(selectedPatient?.id || selectedPatient?._id, 'Completed');
        }}
        patientName={selectedPatient?.patient_name}
      />

      <CancelModal 
        visible={cancelVisible} 
        onClose={() => setCancelVisible(false)} 
        onConfirm={() => {
          setCancelVisible(false);
          handleStatusUpdate(selectedPatient?.id || selectedPatient?._id, 'Cancelled');
        }}
        patientName={selectedPatient?.patient_name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingTop: 20,
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
  notificationIconContainer: {
    backgroundColor: '#FFF',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
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
  pageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  activeTabBtn: {
    borderBottomWidth: 3,
    borderBottomColor: '#0D6EFD',
  },
  tabText: {
    color: '#999',
    fontWeight: 'bold',
    fontSize: 13,
  },
  activeTabText: {
    color: '#0D6EFD',
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 30,
  },
  requestCard: {
    backgroundColor: '#F5F6F8',
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
    shadowOpacity: 0,
    elevation: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0D6EFD',
  },
  statusBadge: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent'
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
    flexShrink: 1,
    width: 'auto', // change from fixed 110 to auto for date
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  approveBtn: {
    backgroundColor: '#2CD95C',
  },
  completeBtn: {
    backgroundColor: '#2CD95C',
  },
  rescheduleBtn: {
    backgroundColor: '#FDBA31',
  },
  cancelBtn: {
    backgroundColor: '#C4C4C4',
  },
  btnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center'
  },
});
