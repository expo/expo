import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../common/ThemeProvider';

export default function Portal({ isVisible, children }) {
  const { theme } = useTheme();

  if (!children) {
    return null;
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor: theme.background.default, opacity: isVisible ? 0.5 : 0 },
      ]}
      pointerEvents="none">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
