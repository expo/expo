import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This screen is not supported on web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
  },
});
