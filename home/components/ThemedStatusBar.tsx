import { useTheme, useIsFocused } from '@react-navigation/native';
import { useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';

export default function ThemedStatusBar() {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const expoTheme = useExpoTheme();

  const barStyle = theme.dark ? 'light-content' : 'dark-content';

  // When switching from an Expo project back to home sometimes the status bar will be
  // changed back to the default status bar. This resolves that issue, but is messy.
  if (Platform.OS === 'android' && isFocused) {
    StatusBar.setBarStyle(barStyle);
  }

  return <StatusBar barStyle={barStyle} backgroundColor={expoTheme.background.default} />;
}
