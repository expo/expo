import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

import Colors from '../constants/Colors';
import { useThemeName } from '../hooks/useThemeName';

export default ({ label, onPress }) => {
  const themeName = useThemeName();
  const backgroundColor = themeName === 'dark' ? Colors.dark.tint : Colors.light.tint;

  return (
    <TouchableOpacity style={[styles.buttonContainer, { backgroundColor }]} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 4,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
