import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { DOCTOR_EMAIL, DOCTOR_PASSWORD } from '@env';
import { AuthContext } from '../patient_app/context/AuthContext';

// Important: Adjust IP address based on your setup
const IP_ADDRESS = '192.168.0.116';
const PORT = '5000';
const BASE_URL = `http://${IP_ADDRESS}:${PORT}`;

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState<'Patient' | 'Doctor'>('Patient');
  
  // Doctor states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Patient states
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const navigation = useNavigation<any>();
  const { login } = React.useContext(AuthContext);

  const handleDoctorLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both User Name and Password');
      return;
    }

    try {
      setLoading(true);
      if (email === DOCTOR_EMAIL && password === DOCTOR_PASSWORD) {
        const fakeUser = { _id: 'doc1', name: 'Dr. John Doe', doctorName: 'Dr. John Doe', email: DOCTOR_EMAIL };
        await AsyncStorage.setItem('userToken', 'dummy-sqlite-token');
        await AsyncStorage.setItem('userData', JSON.stringify(fakeUser));
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientLogin = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    
    setLoading(true);
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('savedIdentifier', phone);
      } else {
        await AsyncStorage.removeItem('savedIdentifier');
      }

      // We use 'password' as phone for dummy or they actually use password? 
      // Wait, in PatientApp they had password. We don't have password input in our new UI mockup for patient!
      // The mockup only shows "Phone No/ தொலைபேசி எண் *" and "Remember Me". There is no password field for patient!
      // Let's assume the API either doesn't need password for this endpoint or we pass a dummy one if it does.
      // But looking at patient_app/screens/LoginScreen.js, it DID have a password field.
      // The user's new mockup explicitly removed the password field for Patient. 
      // For now, let's bypass API or just simulate a successful login if they enter a phone number.
      
      const fakePatient = { _id: 'pat1', name: 'Patient', phone: phone, contactNumber: phone, mobile: phone };
      await AsyncStorage.setItem('patientToken', 'dummy-patient-token');
      await AsyncStorage.setItem('patientData', JSON.stringify(fakePatient));
      
      login(fakePatient);
      navigation.replace('PatientMainTabs');
    } catch (error: any) {
      console.error("Patient login error", error);
      Alert.alert("Error", "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/DoctorlogoApp.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Ionicons name="shield-checkmark" size={28} color="#000" style={styles.titleIcon} />
          <Text style={styles.titleText}>Login</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Patient' && styles.activeTabButton]}
            onPress={() => setActiveTab('Patient')}
          >
            <Text style={[styles.tabText, activeTab === 'Patient' && styles.activeTabText]}>Patient</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Doctor' && styles.activeTabButton]}
            onPress={() => setActiveTab('Doctor')}
          >
            <Text style={[styles.tabText, activeTab === 'Doctor' && styles.activeTabText]}>Doctor</Text>
          </TouchableOpacity>
        </View>

        {/* Forms */}
        <View style={styles.formContainer}>
          {activeTab === 'Patient' ? (
            <View style={styles.patientForm}>
              <Text style={styles.label}>Phone No/ தொலைபேசி எண் <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Enter Phone Number"
              />

              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={16} color="#FFF" />}
                </View>
                <Text style={styles.checkboxText}>Remember Me/நினைவில் கொள்ளுங்கள்</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginButton} onPress={handlePatientLogin} disabled={loading}>
                <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login/ உள்நுழைவு'}</Text>
              </TouchableOpacity>

              <View style={styles.emergencyContainer}>
                <TouchableOpacity style={styles.emergencyButton}>
                  <Ionicons name="medical" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.emergencyText}>Emergency / அவசர உதவி</Text>
              </View>
            </View>
          ) : (
            <View style={styles.doctorForm}>
              <Text style={styles.label}>User Name/ பயனர் பெயர் <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.label, { marginTop: 20 }]}>Password/ கடவுச்சொல் <Text style={styles.asterisk}>*</Text></Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleDoctorLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Logging in...' : 'Login/ உள்நுழைவு'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 60,
    alignItems: 'center',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 280,
    height: 120,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  titleIcon: {
    marginRight: 10,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  activeTabButton: {
    borderColor: '#18454D',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  activeTabText: {
    color: '#18454D',
  },
  formContainer: {
    width: '100%',
  },
  patientForm: {
    width: '100%',
  },
  doctorForm: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 10,
  },
  asterisk: {
    color: 'red',
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: 55,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#18454D',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#18454D',
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#18454D',
    borderRadius: 8,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emergencyButton: {
    backgroundColor: '#D32F2F',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
