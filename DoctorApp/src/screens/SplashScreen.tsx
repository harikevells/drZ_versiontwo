import React, { useEffect } from 'react';
import { View, StyleSheet, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const checkLoginAndNavigate = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Failed to load user data during splash screen:', error);
        navigation.replace('Login');
      }
    };

    const timer = setTimeout(() => {
      checkLoginAndNavigate();
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#052A3F" />
      <Image
        source={require('../assets/DoctorlogoApp.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#052A3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 280,
    height: 220,
  },
});
