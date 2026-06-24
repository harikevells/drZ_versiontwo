import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../utils/database';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    
    // Auto refresh every 10 seconds to reflect deleted old data
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        const docName = parsed.doctorName || parsed.name || 'Dr. John Doe';
        if (docName) {
          const notifs = await getNotifications(docName);
          setNotifications(notifs as any);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => 
        prev.map((notif: any) => (notif._id === id || notif.id === id ? { ...notif, isRead: true } : notif))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        const docName = parsed.doctorName || parsed.name || 'Dr. John Doe';
        await markAllNotificationsAsRead(docName);
        setNotifications((prev) => prev.map((notif: any) => ({ ...notif, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-done" size={20} color="#0084FF" />
            <Text style={{ color: '#0084FF', marginLeft: 5, fontSize: 14 }}>Mark all</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0084FF" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {notifications.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>No notifications found.</Text>
          ) : (
            notifications.map((item: any) => (
              <TouchableOpacity 
                key={item.id || item._id} 
                style={[styles.notificationCard, !item.isRead && { backgroundColor: '#f0f7ff', borderColor: '#0084FF', borderWidth: 1 }]}
                onPress={() => { if (!item.isRead) handleMarkAsRead(item.id || item._id); }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="notifications-circle" size={40} color={!item.isRead ? "#0084FF" : "#ccc"} />
                </View>
                <View style={styles.contentContainer}>
                  <Text style={[styles.title, !item.isRead && styles.newTitle]}>{item.title}</Text>
                  <Text style={styles.description}>{item.message}</Text>
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#052A3F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  notificationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  newTitle: {
    color: '#0084FF',
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 10,
    color: '#A0A0A0',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0084FF',
    alignSelf: 'center',
    marginLeft: 10,
  }
});
