import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // This state holds the logged-in patient's details
  const [user, setUser] = useState(null); 

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await AsyncStorage.getItem('patientData');
        if (data) {
          setUser(JSON.parse(data));
        }
      } catch (e) {
        console.error("Failed to load patient data", e);
      }
    };
    loadUser();
  }, []);

  const login = (patientData) => {
    setUser(patientData);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('patientData');
      await AsyncStorage.removeItem('patientToken');
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};