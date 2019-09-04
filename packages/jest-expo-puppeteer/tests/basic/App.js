import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import getenv from 'getenv';

export default function App() {
  return (
    <LinearGradient colors={['orange', 'blue']} style={styles.container}>
      <Text testID="basic-text">Open up App.js to start working on your app!</Text>
      {getenv.boolish('CI', false) && <Text testID="has-ci-text">Has CI env</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
