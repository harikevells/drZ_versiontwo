import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// Use same IP configuration as other screens
const IP_ADDRESS = '192.168.0.116'; 
const PORT = '5000';
const BASE_URL = `http://${IP_ADDRESS}:${PORT}`;

const NotificationPatient = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!user || (!user.contactNumber && !user.mobile)) {
      setLoading(false);
      return;
    }
    
    try {
      const mobile = user.contactNumber || user.mobile;
      const response = await axios.get(`${BASE_URL}/api/emails/patient-appointments/${mobile}`);
      
      const appointments = response.data || [];
      
      // Transform appointments into notifications
      const generatedNotifications = appointments.map(app => {
        let title = '';
        let message = '';
        let iconName = 'bell-outline';
        let iconColor = '#1C3E55';

        switch (app.status) {
          case 'Pending':
            title = 'Appointment Requested';
            message = `Your request for Dr. ${app.doctor_name} is currently pending approval.`;
            iconName = 'clock-outline';
            iconColor = '#F39C12'; // Orange
            break;
          case 'Approved':
            title = 'Appointment Approved';
            message = `Your appointment with Dr. ${app.doctor_name} is confirmed for ${app.appointment_date} at ${app.appointment_time}.`;
            iconName = 'check-circle-outline';
            iconColor = '#27AE60'; // Green
            break;
          case 'Rescheduled':
            title = 'Appointment Rescheduled';
            message = `Your appointment with Dr. ${app.doctor_name} has been rescheduled to ${app.appointment_date} at ${app.appointment_time}.`;
            iconName = 'calendar-clock-outline';
            iconColor = '#3498DB'; // Blue
            break;
          case 'Completed':
            title = 'Appointment Completed';
            message = `Your appointment with Dr. ${app.doctor_name} has been completed. Thank you!`;
            iconName = 'check-all';
            iconColor = '#8E44AD'; // Purple
            break;
          case 'Cancelled':
            title = 'Appointment Cancelled';
            message = `Your appointment with Dr. ${app.doctor_name} has been cancelled.`;
            iconName = 'close-circle-outline';
            iconColor = '#E74C3C'; // Red
            break;
          default:
            title = 'Appointment Update';
            message = `Your appointment with Dr. ${app.doctor_name} status: ${app.status}.`;
            iconName = 'information-outline';
            iconColor = '#1C3E55';
        }

        return {
          id: app._id || Math.random().toString(),
          title,
          message,
          iconName,
          iconColor,
          status: app.status,
          date: new Date(app.updatedAt || app.createdAt).toLocaleDateString()
        };
      });

      setNotifications(generatedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.notificationCard}>
      <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '20' }]}>
        <Icon name={item.iconName} size={30} color={item.iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMessage}>{item.message}</Text>
        <Text style={styles.cardDate}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={28} color="#1C3E55" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#1C3E55" />
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="bell-off-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No new notifications</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C3E55' },
  content: { flex: 1 },
  listContainer: { padding: 16 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center'
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardMessage: { fontSize: 14, color: '#555', lineHeight: 20 },
  cardDate: { fontSize: 12, color: '#999', marginTop: 8, alignSelf: 'flex-end' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 16, color: '#888' }
});

export default NotificationPatient;
