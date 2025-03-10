import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as ReactNavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useNotificationObserverInRootLayout } from '../Notifier';
import { ThemeColors } from '../colors';

export default function Root() {
  useNotificationObserverInRootLayout();
  const colorScheme = useColorScheme();

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
