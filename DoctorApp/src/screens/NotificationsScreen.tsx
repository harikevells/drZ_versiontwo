import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}/notifications`;

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorName, setDoctorName] = useState('');

  const fetchNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.doctorName) {
          setDoctorName(parsed.doctorName);
          const response = await axios.get(`${API_URL}/doctor/${parsed.doctorName}`);
          const filteredNotifications = response.data.filter((n: any) => 
            !(n.type === 'followup_scheduled' || n.type === 'followup_reminder' || (n.title || '').toLowerCase().includes('follow-up'))
          );
          setNotifications(filteredNotifications);
        }
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to fetch notifications: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchNotifications(notifications.length === 0);
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_URL}/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) =>
        prev.map((notif: any) => (notif._id === id || notif.id === id ? { ...notif, isRead: true } : notif))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const formatMessageDate = (text: string) => {
    if (!text) return '';
    // Converts YYYY-MM-DD or YYYY/MM/DD to DD/MM/YYYY
    return text.replace(/(\d{4})[-\/](\d{2})[-\/](\d{2})/g, '$3/$2/$1');
  };

  const formatDateLeft = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[d.getDay()];
    return `${day}/${month}/${year}  ${dayName}`;
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 60) return `${diffMins <= 0 ? 1 : diffMins} Min Ago`;
    if (diffHrs < 24) return `${diffHrs} Hr${diffHrs > 1 ? 's' : ''} Ago`;
    if (diffDays < 30) return `${diffDays} Day${diffDays > 1 ? 's' : ''} Ago`;
    return `${diffMonths} Mon${diffMonths > 1 ? 's' : ''} Ago`;
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n: any) => !n.isRead);
    if (unreadNotifications.length === 0) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n: any) => ({ ...n, isRead: true })));
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };

      if (doctorName) {
        await axios.put(`${API_URL}/readAll/doctor/${doctorName}`, {}, { headers });
      } else {
        await Promise.all(unreadNotifications.map((n: any) => axios.put(`${API_URL}/${n.id || n._id}/read`, {}, { headers })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      fetchNotifications(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.blueTopBackground} />
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerBtn} onPress={handleMarkAllAsRead}>
          <Ionicons name="checkmark-done" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.whiteBackground}>
        {loading ? (
          <ActivityIndicator size="large" color="#0084FF" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >

            {notifications.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>No notifications found.</Text>
            ) : (
              notifications.map((item: any) => {
                const titleStr = (item.title || '').toLowerCase();
                
                let iconName = 'notifications-outline';
                let iconBgColor = '#F0F4F8';
                let titleColor = '#4A5568';
                
                if (titleStr.includes('appointment')) {
                  iconName = 'calendar-outline';
                  iconBgColor = '#E6F0FA';
                  titleColor = '#0084FF';
                } else if (titleStr.includes('schedule')) {
                  iconName = 'time-outline';
                  iconBgColor = '#FFF5E6';
                  titleColor = '#FF9500';
                }

                return (
                  <TouchableOpacity
                    key={item.id || item._id}
                    style={[
                      styles.notificationItem,
                      !item.isRead && styles.unreadNotificationItem
                    ]}
                    onPress={async () => {
                      if (!item.isRead) await handleMarkAsRead(item.id || item._id);

                      if (!titleStr.includes('schedule')) {
                        navigation.navigate('MainTabs', {
                          screen: 'Appointment',
                          params: {
                            activeTab: 'Pending',
                            highlightBookingId: item.booking_id || item.appointment_id || item.appointmentId,
                            highlightMessage: item.message,
                            _timestamp: Date.now()
                          }
                        });
                      }
                    }}
                  >
                    <View style={styles.itemRow}>
                      <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                        <Ionicons name={iconName} size={20} color={titleColor} />
                      </View>
                      
                      <View style={styles.contentColumn}>
                        <Text style={[styles.title, !item.isRead && styles.unreadTitle, { color: titleColor }]}>
                          {formatMessageDate(item.title)}
                        </Text>
                        <Text style={styles.description}>{formatMessageDate(item.message)}</Text>
                        <View style={styles.itemFooter}>
                          <Text style={styles.footerText}>{formatDateLeft(item.createdAt).replace('  ', ' - ')}</Text>
                          <Text style={styles.footerTextRight}>{formatTimeAgo(item.createdAt)}</Text>
                        </View>
                      </View>
                    </View>
                    {!item.isRead && <View style={[styles.redDot, { backgroundColor: titleColor }]} />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
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
    paddingTop: 40,
    paddingBottom: 30,
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
  whiteBackground: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    width: '95%',
    alignSelf: 'center',
    overflow: 'hidden',
    paddingTop: 15,
  },
  scrollContent: {
    paddingHorizontal: 13,
    paddingTop: 5,
    paddingBottom: 30,
  },
  notificationItem: {
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E6F0FA',
  },
  unreadNotificationItem: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6F0FA',
  },
  itemRow: {
    flexDirection: 'row',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  contentColumn: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0084FF',
    marginBottom: 6,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#A0A0A0',
  },
  footerTextRight: {
    fontSize: 11,
    color: '#A0A0A0',
  },
  redDot: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
  }
});
