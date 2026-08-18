import { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export function useDoctorStatus() {
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState('Your Hospital account is Expired. Contact Administrator.');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return; // Not logged in

        const response = await axios.get(`${API_BASE_URL}/auth/doctor/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.locked) {
          setIsLocked(true);
          setLockReason(response.data.reason || 'Your Hospital account is Expired. Contact Administrator.');
        } else {
          setIsLocked(false);
        }
      } catch (error: any) {
        // If 401 Unauthorized or 403 Forbidden is returned, we can also lock them out.
        if (error.response?.status === 401 || error.response?.status === 403) {
          setIsLocked(true);
          if (error.response?.data?.error) {
              setLockReason(error.response.data.error);
          }
        }
      }
    };

    // Initial check
    checkStatus();

    // Poll every 2 seconds
    interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  return { isLocked, lockReason };
}
