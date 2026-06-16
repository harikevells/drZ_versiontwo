import React from 'react';
import { AuthProvider } from './src/context/AuthContext'; 
import { LanguageProvider } from './src/context/LanguageContext'; 
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>  
        <AppNavigator />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;