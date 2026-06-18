import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface HeaderProps {
  title?: string;
  isNotification?: boolean;
}

export default function Header({ title, isNotification = false }: HeaderProps) {
  const navigation = useNavigation<any>();
  const [doctorName, setDoctorName] = useState('Doctor');
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Get Doctor Name
    const loadUserData = async () => {
      try {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.doctorName) setDoctorName(parsed.doctorName);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadUserData();

    // Get Time-based Greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Get Formatted Date
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    
    setCurrentDate(`${dayName}, ${monthName} ${dayNum}, ${year}`);
  }, []);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.userInfo}>
          <Image 
            source={require('../assets/doctorlogo.png')} 
            style={styles.avatar}
          />
          <View style={styles.textContainer}>
            {title ? (
              <Text style={styles.greeting}>{title}</Text>
            ) : (
              <>
                <Text style={styles.greeting}>{greeting}, Dr. {doctorName}</Text>
                <Text style={styles.date}>{currentDate}</Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#052A3F',
    height: 140,
    // width: '100%',
    // borderBottomLeftRadius: width * 0.95,
    // borderBottomRightRadius: width * 0.95,
    // transform: [{ scaleX: 1.5 }],
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 30,
    marginBottom: 20,
  },
  headerContent: {
    // transform: [{ scaleX: 0.66 }],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#FFF',
  },
  textContainer: {
    marginLeft: 12,
  },
  greeting: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    color: '#A0B3C1',
    fontSize: 13,
    marginTop: 4,
  },
});
