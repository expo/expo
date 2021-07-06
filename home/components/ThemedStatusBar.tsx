import { useTheme, useIsFocused } from '@react-navigation/native';
import * as Device from 'expo-device';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';

export default function ThemedStatusBar() {
  const theme = useTheme();
  const isFocused = useIsFocused();

  // Android below API 23 (Android 6.0) does not support 'dark-content' barStyle:
  // - statusBar shouldn't be translucent
  // - backgroundColor should be a color that would make status bar icons be visible
  const translucent = !(Platform.OS === 'android' && Device.platformApiLevel! < 23);
  const backgroundColor = theme.dark ? '#000000' : translucent ? '#ffffff' : '#00000088';
  const barStyle = theme.dark ? 'light-content' : 'dark-content';

  // When switching from an Expo project back to home sometimes the status bar will be
  // changed back to the default status bar. This resolves that issue, but is messy.
  if (Platform.OS === 'android' && isFocused) {
    StatusBar.setBarStyle(barStyle);
  }

  return (
    <StatusBar translucent={translucent} barStyle={barStyle} backgroundColor={backgroundColor} />
  );
}
