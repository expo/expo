import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as ReactNavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeColors } from '../misc/colors';
import { useNotificationResponseRedirect } from '../useNotificationResponseRedirect';

import setColorScheme = Appearance.setColorScheme;

export default function Root() {
  useNotificationResponseRedirect();
  const colorScheme = useColorScheme();

  useEffect(() => {
    // it just looks better
    setColorScheme('light');
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReactNavigationThemeProvider
        value={colorScheme === 'dark' ? CustomNavigationDarkTheme : CustomNavigationLightTheme}>
        <Stack screenOptions={{}} />
      </ReactNavigationThemeProvider>
    </GestureHandlerRootView>
  );
}

const CustomNavigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#000',
  },
};

const CustomNavigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: ThemeColors.dark.tint,
    text: '#fff',
    notification: '#fff',
  },
};
