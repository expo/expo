import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

export default ({ label, onPress }) => (
  <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: '#4630eb',
    borderRadius: 4,
    padding: 12,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
