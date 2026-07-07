import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import RescheduleModal from '../components/RescheduleModal';
import ApproveModal from '../components/ApproveModal';
import CancelModal from '../components/CancelModal';

import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}/appointments`;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  
  const [stats, setStats] = useState({ todaysAppointments: 0, pendingAppointments: 0, rescheduleAppointments: 0, totalAttended: 0 });
  const [patientRequests, setPatientRequests] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setDoctorName(user.doctorName);
        const response = await axios.get(`${API_URL}/dashboard/${user.doctorName}`);
        
        const data = response.data;
        const pendingCount = data.patientRequests.filter((req: any) => req.status.toLowerCase() === 'pending').length;
        const rescheduledCount = data.patientRequests.filter((req: any) => req.status.toLowerCase() === 'rescheduled').length;

        setStats({
          todaysAppointments: data.stats.todaysAppointments || 0,
          pendingAppointments: pendingCount,
          rescheduleAppointments: rescheduledCount,
          totalAttended: data.stats.totalAttended || 0
        });
        setPatientRequests(data.patientRequests);
        setRecentPatients(data.recentPatients);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchDashboardData();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.put(`${API_URL}/${id}/status`, { status });
      Alert.alert('Success', `Appointment ${status.toLowerCase()} successfully!`);
      fetchDashboardData(); // Refresh list after update
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update appointment status.');
    }
  };

  const openReschedule = (patient: any) => {
    setSelectedPatient(patient);
    setRescheduleVisible(true);
  };

  const openApprove = (patient: any) => {
    setSelectedPatient(patient);
    setApproveVisible(true);
  };

  const openCancel = (patient: any) => {
    setSelectedPatient(patient);
    setCancelVisible(true);
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#666';
    switch (status.toLowerCase()) {
      case 'pending': return '#FFA500';
      case 'approved': return '#2CA01C';
      case 'rescheduled': return '#0084FF';
      case 'cancelled': return '#FF4C4C';
      case 'completed': return '#052A3F';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#052A3F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Appointments Summary */}
        <Text style={styles.sectionTitle}>Appointments</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCardBlue}>
            <Text style={styles.statNumberWhite}>{stats.todaysAppointments < 10 ? `0${stats.todaysAppointments}` : stats.todaysAppointments}</Text>
            <Text style={styles.statLabelWhite}>Today's{'\n'}Appointment</Text>
          </View>
          <View style={styles.statCardBlue}>
            <Text style={styles.statNumberWhite}>{stats.pendingAppointments < 10 ? `0${stats.pendingAppointments}` : stats.pendingAppointments}</Text>
            <Text style={styles.statLabelWhite}>Pending{'\n'}Appointment</Text>
          </View>
          <View style={styles.statCardBlue}>
            <Text style={styles.statNumberWhite}>{stats.rescheduleAppointments < 10 ? `0${stats.rescheduleAppointments}` : stats.rescheduleAppointments}</Text>
            <Text style={styles.statLabelWhite}>Reschedule{'\n'}Appointment</Text>
          </View>
        </View>

        {/* Patient Request */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patient Request</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointment')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {patientRequests.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No pending requests.</Text>
        ) : (
          patientRequests.slice(0, 3).map((patient: any) => (
            <View key={patient.id || patient._id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>{patient.patient_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) }]}>
                  <Text style={styles.statusText}>{patient.status}</Text>
                </View>
              </View>
              <Text style={styles.dateTime}>{patient.appointment_date} {patient.appointment_time}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.btn, styles.approveBtn]}
                  onPress={() => openApprove(patient)}
                >
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.rescheduleBtn]}
                  onPress={() => openReschedule(patient)}
                >
                  <Text style={styles.btnText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => openCancel(patient)}
                >
                  <Text style={styles.btnTextDark}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Recent Patient History */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Recent Patient History</Text>
        {recentPatients.length === 0 ? (
           <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No recent history.</Text>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={recentPatients}
            keyExtractor={(item: any) => item.id || item._id}
            renderItem={({ item }: { item: any }) => (
              <View style={styles.recentPatientCard}>
                <View style={styles.cardBase}>
                  <Image 
                    source={item.patient_gender === 'Female' ? require('../assets/femalepatient.png') : require('../assets/malepatient.png')} 
                    style={styles.patientImage}
                  />
                  <View style={styles.recentNameBadge}>
                    <Text style={styles.recentName}>{item.patient_name}</Text>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.recentList}
          />
        )}
        
      </ScrollView>

      {/* Modals */}
      <RescheduleModal 
        visible={rescheduleVisible} 
        onClose={() => { setRescheduleVisible(false); fetchDashboardData(); }} 
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
    backgroundColor: '#F0F4FF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  viewAll: {
    fontSize: 12,
    color: '#052A3F',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCardBlue: {
    backgroundColor: '#0D6EFD',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    width: '32%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 110,
    justifyContent: 'center',
  },
  statNumberWhite: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  statLabelWhite: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: 'bold',
    lineHeight: 16,
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 3,
  },
  approveBtn: {
    backgroundColor: '#2CA01C',
  },
  rescheduleBtn: {
    backgroundColor: '#0084FF',
  },
  cancelBtn: {
    backgroundColor: '#E0E0E0',
  },
  btnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    width:100,
    textAlign:'center'
  },
  btnTextDark: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recentList: {
    paddingTop: 85,
    paddingBottom: 5,
    paddingLeft: 5,
  },
  recentPatientCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 140,
  },
  cardBase: {
    width: 140,
    height: 70,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  patientImage: {
    width: 120,
    height: 140,
    resizeMode: 'contain',
    position: 'absolute',
    bottom: 25,
    zIndex: 1,
  },
  recentNameBadge: {
    backgroundColor: '#E83F5B',
    width: '100%',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  recentName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
