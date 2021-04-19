import firstMessage from '@eyw/first-package';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import secondMessage from 'second-package';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Hello from the first application</Text>
      <Text>{firstMessage}</Text>
      <Text>{secondMessage}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
