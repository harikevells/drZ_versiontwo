import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import MainTabs from './navigation/MainTabs';
import NotificationsScreen from './screens/NotificationsScreen';

// Patient App imports
import { LanguageProvider } from './patient_app/context/LanguageContext';
import { AuthProvider } from './patient_app/context/AuthContext';
import { DashboardTabs as PatientDashboardTabs } from './patient_app/navigation/AppNavigator';
import BookAppointmentScreen from './patient_app/screens/BookAppointmentScreen';
import NotificationPatient from './patient_app/screens/NotificationPatient';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            
            <Stack.Screen name="PatientMainTabs" component={PatientDashboardTabs} />
            <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
            <Stack.Screen name="NotificationPatient" component={NotificationPatient} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </LanguageProvider>
  );
}
