import { ThemeProvider } from 'ThemeProvider';
import * as Splashscreen from 'expo-splash-screen';
import React from 'react';

import MainNavigator, { optionalRequire } from './MainNavigator';
import { Directory, Paths } from 'expo-file-system';

let Notifications;
try {
  Notifications = require('expo-notifications');
} catch {
  // do nothing
}

Splashscreen.setOptions({ fade: true, duration: 800 });

// Require the `BackgroundTaskScreen` component from `native-component-list` if it's available
// so that we load the module and register its background task on startup.
optionalRequire(() => require('native-component-list/src/screens/BackgroundTaskScreen'));

// Require the `BackgroundFetchScreen` component from `native-component-list` if it's available
// so that we load the module and register its background task on startup.
optionalRequire(() => require('native-component-list/src/screens/BackgroundFetchScreen'));

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
  console.log(
    new Directory(
      'file:///Users/aleqsio/Library/Developer/CoreSimulator/Devices/84F095BE-AA19-47D8-82B3-743473B42D81/data/Containers/Data/Application/10BBDC9C-9830-431A-9871-E8CE3CCB2804/Documents/ExponentExperienceData/@anonymous/sandbox-9532ccac-aed7-4855-a22f-eeeec8ef1dd1/'
    ).listAsRecords()
  );
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
