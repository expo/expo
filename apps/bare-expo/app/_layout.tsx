import { ThemeProvider, useTheme } from 'ThemeProvider';
import BenchmarkHelper from 'benchmark-helper';
import * as DevMenu from 'expo-dev-menu';
import { AppMetrics, Observe, ObserveRoot } from 'expo-observe';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import * as Splashscreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { optionalRequire } from '../optionalRequire';

let Notifications;
try {
  Notifications = require('expo-notifications');
} catch {
  // do nothing
}

if (process.env.EXPO_OS !== 'web') {
  DevMenu.registerDevMenuItems([
    {
      name: 'Action 1',
      callback: () => {
        console.log('Action 1 executed');
      },
      shouldCollapse: true,
    },
    {
      name: 'Action 2',
      callback: () => {
        console.log('Action 2 executed');
      },
      shouldCollapse: false,
    },
  ]);
}

Splashscreen.setOptions({ fade: true, duration: 800 });

// Require the `BackgroundTaskScreen` component from `native-component-list` if it's available
// so that we load the module and register its background task on startup.
optionalRequire(() => require('native-component-list/src/screens/BackgroundTaskScreen'));

// Require the `BackgroundFetchScreen` component from `native-component-list` if it's available
// so that we load the module and register its background task on startup.
optionalRequire(() => require('native-component-list/src/screens/BackgroundFetchScreen'));

const loadAssetsAsync =
  optionalRequire(() => require('native-component-list/src/utilities/loadAssetsAsync'))?.default ??
  (async () => null);

const getSearchScreenOptions = optionalRequire(() =>
  require('native-component-list/src/screens/SearchScreen')
)?.getSearchScreenOptions;

function useLoaded() {
  const [isLoaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    let isMounted = true;
    loadAssetsAsync()
      .then(() => {
        if (isMounted) setLoaded(true);
        Splashscreen.hide();
      })
      .catch((e) => {
        console.warn('Error loading assets: ' + e.message);
        if (isMounted) setLoaded(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  return isLoaded;
}

Observe.configure({
  dispatchingEnabled: true,
  sampleRate: 0.9,
  integrations: {
    'expo-router': { filteredParams: ['accountId', 'firstName'] },
  },
});

function RootLayout() {
  const { name: themeName, theme } = useTheme();

  React.useEffect(() => {
    AppMetrics.markInteractive({
      params: {
        theme: themeName,
      },
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider value={themeName === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="redirect" />
          <Stack.Screen name="search" options={getSearchScreenOptions?.(theme)} />
        </Stack>
        <StatusBar style={themeName === 'light' ? 'dark' : 'light'} />
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function Layout() {
  React.useEffect(() => {
    try {
      const subscription = Notifications.addNotificationResponseReceivedListener(
        ({ notification, actionIdentifier }) => {
          console.info(
            `User interacted with a notification (action = ${actionIdentifier}): ${JSON.stringify(
              notification,
              null,
              2
            )}`
          );
        }
      );
      return () => subscription?.remove();
    } catch (e) {
      console.debug('Could not have added a listener for received notification responses.', e);
    }
  }, []);

  const isLoaded = useLoaded();

  React.useEffect(() => {
    if (isLoaded) {
      BenchmarkHelper.reportFullyDrawn();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return null;
  }

  return (
    <ObserveRoot>
      <ThemeProvider>
        <RootLayout />
      </ThemeProvider>
    </ObserveRoot>
  );
}
