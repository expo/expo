import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function Portal({ isVisible, children }) {
  if (!children) {
    return null;
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.container, { opacity: isVisible ? 0.5 : 0 }]}
      pointerEvents="none">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(255, 255, 255)',
  },
});
