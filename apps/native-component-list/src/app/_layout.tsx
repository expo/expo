import { ThemeProvider, useTheme } from 'ThemeProvider';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { getSearchScreenOptions } from '../screens/SearchScreen';
import loadAssetsAsync from '../utilities/loadAssetsAsync';

SplashScreen.preventAutoHideAsync();

function useSplashScreen(loadingFunction: () => Promise<void>) {
  const [isLoadingCompleted, setLoadingComplete] = React.useState(false);

  // Load any resources or data that we need prior to rendering the app
  React.useEffect(() => {
    async function loadAsync() {
      try {
        await loadingFunction();
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        await SplashScreen.hide();
      }
    }

    loadAsync();
  }, []);

  return isLoadingCompleted;
}

function RootLayout() {
  const { name: themeName, theme } = useTheme();
  const isLoadingCompleted = useSplashScreen(async () => {
    await loadAssetsAsync();
  });

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle(themeName === 'dark' ? 'light-content' : 'dark-content', true);
    }
  }, [themeName]);

  if (!isLoadingCompleted) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider value={themeName === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ presentation: 'modal', headerShown: false }}>
          <Stack.Screen name="(main)" />
          <Stack.Screen name="redirect" />
          <Stack.Screen name="search" options={getSearchScreenOptions(theme)} />
        </Stack>
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <RootLayout />
    </ThemeProvider>
  );
}
