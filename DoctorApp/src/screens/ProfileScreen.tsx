import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { getDoctorProfile, clearAllDatabaseData } from '../utils/database';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your account?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userData');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error("Logout failed", error);
              Alert.alert("Error", "Failed to logout");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all appointments and notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear Data", 
          onPress: async () => {
            try {
              await clearAllDatabaseData();
              Alert.alert("Success", "All stored database data has been cleared.");
            } catch (error) {
              console.error("Clear data failed", error);
              Alert.alert("Error", "Failed to clear data");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData(parsedData);
          
          try {
            const fullProfile = await getDoctorProfile(parsedData.email);
            if (fullProfile) {
              setUserData({ ...parsedData, ...fullProfile });
            }
          } catch (apiError) {
            console.error('Failed to fetch full doctor profile from db', apiError);
          }
        }
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#052A3F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { overflow: 'hidden' }]}>
            <Image 
              source={require('../assets/doctorlogo.png')} 
              style={{ width: '100%', height: '100%', resizeMode: 'contain' }} 
            />
          </View>
          <Text style={styles.doctorName}>{userData?.doctorName?.startsWith('Dr.') ? userData.doctorName : `Dr. ${userData?.doctorName || 'Doctor'}`}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Ionicons name="mail" size={20} color="#052A3F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{userData?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Ionicons name="medical" size={20} color="#052A3F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Specialization</Text>
              <Text style={styles.detailValue}>{userData?.department ? userData.department.split(',').map((dept: string) => dept.split('/')[0].split('-')[0].trim()).filter(Boolean).join(', ') : 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Ionicons name="call" size={20} color="#052A3F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Mobile Number</Text>
              <Text style={styles.detailValue}>{userData?.mobile || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Ionicons name="briefcase" size={20} color="#052A3F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Experience</Text>
              <Text style={styles.detailValue}>{userData?.experience ? `${userData.experience} Years` : 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Ionicons name="male-female" size={20} color="#052A3F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{userData?.gender || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: '#FFA500', marginBottom: 20 }]} onPress={handleClearData}>
          <Ionicons name="trash-bin-outline" size={24} color="#FFF" />
          <Text style={styles.logoutText}>Clear Database Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  profileHeader: {
    backgroundColor: 'transparent',
    paddingTop: 0,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    // marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#052A3F',
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  detailsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF4C4C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginHorizontal: 20,
    marginBottom: 5,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
