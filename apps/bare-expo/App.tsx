import { ThemeProvider } from 'ThemeProvider';
import * as Splashscreen from 'expo-splash-screen';
import React from 'react';

import MainNavigator, { optionalRequire } from './MainNavigator';

let Notifications;
try {
  Notifications = require('expo-notifications');
} catch {
  // do nothing
}

Splashscreen.setOptions({ fade: true });

// Require the `BackgroundFetchScreen` component from `native-component-list` if it's available
// so that we load the module and register its background task on startup.
optionalRequire(() => require('native-component-list/src/screens/BackgroundFetchScreen'));

// Require the `BackgroundLocationMapScreen` component from `native-component-list` if it's available
// so that we load the module and register its background task on startup.
optionalRequire(() =>
  require('native-component-list/src/screens/Location/BackgroundLocationMapScreen')
);

// Require the `GeofencingScreen` component from `native-component-list` if it's available
// so that we load the module and register its background task on startup.
optionalRequire(() => require('native-component-list/src/screens/Location/GeofencingScreen'));

const loadAssetsAsync =
  optionalRequire(() => require('native-component-list/src/utilities/loadAssetsAsync')) ??
  (async () => null);

function useLoaded() {
  const [isLoaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    let isMounted = true;
    // @ts-ignore
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

export default function Main() {
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

  return <ThemeProvider>{isLoaded ? <MainNavigator /> : null}</ThemeProvider>;
}
