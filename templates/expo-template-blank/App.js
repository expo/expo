import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ backgroundColor: '#00fff' }}>
      <Text style={{ fontSize: 24 }}>
        My name is <Text style={{ fontWeight: 'bold' }}>OWUSU PRINCE</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
