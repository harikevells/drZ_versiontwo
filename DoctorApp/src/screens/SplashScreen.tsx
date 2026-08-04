import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, StatusBar, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupPushNotifications } from '../services/PushNotificationService';
import BottomImage from '../assets/bottomimage.svg';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  // Animation value for the progress bar (0 to 1)
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkLoginAndNavigate = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        const token = await AsyncStorage.getItem('userToken');
        if (storedData && token) {
          setupPushNotifications(token, 'doctor');
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Failed to load user data during splash screen:', error);
        navigation.replace('Login');
      }
    };

    // Start 6-second progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(() => {
      // Once animation is complete, navigate
      checkLoginAndNavigate();
    });
  }, [navigation, progressAnim]);

  // Map progress to width percentage
  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />



      {/* Centered Logo */}
      <Image
        source={require('../assets/Dclogo.png')}
        style={styles.logo}
      />

      {/* Bottom Wave Section */}
      <View style={styles.bottomSection}>
        {/* Imported SVG Background */}
        <BottomImage
          width={width}
          height={height * 0.40}
          preserveAspectRatio="none"
          style={styles.waveSvg}
        />

        <View style={styles.contentOverlay}>
          {/* Energy Icon */}
          <Image
            source={{ uri: 'data:image/png;base64,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' }}
            style={styles.energyIcon}
            resizeMode="contain"
            fadeDuration={0}
          />

          {/* Texts */}
          <Text style={styles.sloganText}>The Future of Healthcare, Powered by AI.</Text>
          <Text style={styles.subText}>Innovative digital healthcare solutions designed to simplify clinical workflows and improve patient care.</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressBarWidth }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F8FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8, // Adjust if needed
  },
  logo: {
    width: 320,
    height: 180,
    marginLeft: -10,
    resizeMode: 'contain',
    marginTop: -150, // Offset to visually balance with the bottom wave
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.40,
    justifyContent: 'flex-end',
  },
  waveSvg: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.45,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
    zIndex: 10,
    elevation: 10,
  },
  plusBgImage: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.3, // Subtle blending for the background pluses
  },
  energyIcon: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  sloganText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign:'center',
    marginBottom: 8,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    width:'70%',
    // paddingTop:6,
    textAlign:'center',
    marginBottom: 35,
  },
  progressContainer: {
    width: '75%',
    height: 5,
    justifyContent: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2.5,
  },
});
