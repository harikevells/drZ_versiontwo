import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.text}>Chat Screen (Coming Soon)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#666',
  },
});
