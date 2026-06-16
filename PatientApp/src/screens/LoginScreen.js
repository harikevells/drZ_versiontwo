import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);

  // UI State
  const [mobile, setMobile] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ 1. LOAD SAVED MOBILE NUMBER (No Password)
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedMobile = await AsyncStorage.getItem('savedMobile');

        if (savedMobile) {
          setMobile(savedMobile);
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Failed to load credentials", error);
      }
    };
    loadCredentials();
  }, []);

  const handleLogin = async () => {
    // ✅ VALIDATION: Check if mobile is empty or not 10 digits
    if (!mobile) {
      Alert.alert("Error", "Please enter mobile number");
      return;
    }

    if (mobile.length !== 10) {
      Alert.alert("Invalid Number", "Mobile number must be exactly 10 digits.\nமொபைல் எண் 10 இலக்கங்களாக இருக்க வேண்டும்.");
      return;
    }

    setLoading(true);

    // Simulate API Delay
    setTimeout(async () => {

      // ✅ 2. SAVE OR REMOVE MOBILE NUMBER
      try {
        if (rememberMe) {
          await AsyncStorage.setItem('savedMobile', mobile);
        } else {
          await AsyncStorage.removeItem('savedMobile');
        }
      } catch (error) {
        console.error("Error saving credentials", error);
      }

      // ✅ 3. LOG IN (With Any 10-digit Number)
      const userPayload = {
        uhid: `MOB-${mobile}`,
        name: "Patient", // You can default this or fetch from an API later
        contactNumber: mobile,
        token: "dummy-token-123"
      };

      login(userPayload);

      setLoading(false);
    }, 1000);
  };

  // ✅ Handler for Logo Click (Same as AppointmentScreen)
  const handleLogoClick = () => {
    const phoneNumber = '9876543210';
    let url = Platform.OS === 'android' ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`;
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  const handleAmbulance = () => {
    const phoneNumber = '801';
    Linking.openURL(`tel:${phoneNumber}`).catch(err =>
      Alert.alert('Error', 'Unable to open dialer')
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <ScrollView contentContainerStyle={styles.container}>

        {/* ✅ WRAPPED IN TOUCHABLE OPACITY FOR CLICK FUNCTIONALITY */}
        <TouchableOpacity onPress={handleLogoClick} style={{ alignItems: 'center', width: '100%' }}>
          {/* <View style={styles.topImageContainer}>
            <Image source={require('../assets/motherteressa.png')} style={styles.topImage} resizeMode="contain" />
          </View> */}

          {/* <Text style={styles.hospitalName}>VICTOR</Text>
          <Text style={styles.hospitalSubName}>Hospital</Text> */}

          <View style={styles.poweredByContainer}>
            {/* <Text style={styles.poweredByText}>Powered by</Text> */}
            <Image source={require('../assets/logo.png')} style={styles.drzLogo} resizeMode="contain" />
          </View>
        </TouchableOpacity>

        <View style={styles.loginTitleContainer}>
          <Icon name="cellphone" size={28} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.loginTitle}>Login</Text>
        </View>

        <View style={styles.form}>

          <Text style={styles.label}>
            Phone No/ தொலைபேசி எண் <Text style={styles.star}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit Mobile No"
            placeholderTextColor="#888"
            value={mobile}
            onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ''))} // Only allow numbers
            keyboardType="phone-pad"
            maxLength={10}
          />

          {/* ❌ PASSWORD FIELD REMOVED */}

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <Icon
              name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"}
              size={24}
              color={rememberMe ? "#1C4E63" : "#888"}
            />
            <Text style={styles.checkboxText}>Remember Me/நினைவில் கொள்ளுங்கள்</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#1C4E63" style={{ marginTop: 20 }} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login/ உள்நுழைவு</Text>
            </TouchableOpacity>
          )}

          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <TouchableOpacity style={styles.ambulanceButton} onPress={handleAmbulance}>
              <Icon name="ambulance" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.ambulanceText}>Emergency / அவசர உதவி</Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', paddingHorizontal: 25, paddingTop: 50, paddingBottom: 40, alignItems: 'center' },
  topImageContainer: { marginBottom: 5 },
  topImage: { width: 90, height: 90, borderRadius: 45 },
  hospitalName: { fontSize: 40, fontWeight: '900', color: '#032541', letterSpacing: 1, textAlign: 'center', marginBottom: 0 },
  hospitalSubName: { fontSize: 22, fontWeight: 'bold', color: '#032541', marginTop: -5, textAlign: 'center', marginBottom: 5 },
  poweredByContainer: { alignItems: 'center', marginTop: 5, marginBottom: 30 },
  poweredByText: { fontSize: 10, color: '#555', fontWeight: 'bold', marginBottom: 2 },
  drzLogo: { width: 100, height: 100 },
  loginTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  loginTitle: { fontSize: 26, fontWeight: 'bold', color: '#000' },
  form: { width: '100%' },
  label: { fontSize: 15, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 15 },
  star: { color: 'red' },
  input: { borderWidth: 1.5, borderColor: '#777', borderRadius: 8, padding: 14, fontSize: 18, fontWeight: 'bold', backgroundColor: '#fff', color: '#000', letterSpacing: 2 }, // Increased font size and letter spacing for mobile number
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 10 },
  checkboxText: { marginLeft: 8, fontSize: 14, fontWeight: 'bold', color: '#444' },
  button: { backgroundColor: '#1C4E63', paddingVertical: 15, borderRadius: 8, alignItems: 'center', elevation: 3, marginTop: 25, paddingHorizontal: 20 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  ambulanceButton: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#D32F2F', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, marginBottom: 5, borderWidth: 2, borderColor: '#fff' },
  ambulanceText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 12 }
});

export default LoginScreen;