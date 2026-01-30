import { ThemeProvider } from 'ThemeProvider';
import * as Splashscreen from 'expo-splash-screen';
import React from 'react';
import * as DevMenu from 'expo-dev-menu';

import { useEffect } from 'react';
import { Text } from 'react-native';

import MainNavigator, { optionalRequire } from './MainNavigator';

let Notifications;
try {
  // Notifications = require('expo-notifications');
} catch {
  // do nothing
}

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

Splashscreen.setOptions({ fade: true, duration: 800 });

// // Require the `BackgroundTaskScreen` component from `native-component-list` if it's available
// // so that we load the module and register its background task on startup.
// optionalRequire(() => require('native-component-list/src/screens/BackgroundTaskScreen'));

// // Require the `BackgroundFetchScreen` component from `native-component-list` if it's available
// // so that we load the module and register its background task on startup.
// optionalRequire(() => require('native-component-list/src/screens/BackgroundFetchScreen'));

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
  // React.useEffect(() => {
  //   try {
  //     const subscription = Notifications.addNotificationResponseReceivedListener(
  //       ({ notification, actionIdentifier }) => {
  //         console.info(
  //           `User interacted with a notification (action = ${actionIdentifier}): ${JSON.stringify(
  //             notification,
  //             null,
  //             2
  //           )}`
  //         );
  //       }
  //     );
  //     return () => subscription?.remove();
  //   } catch (e) {
  //     console.debug('Could not have added a listener for received notification responses.', e);
  //   }
  // }, []);

  const isLoaded = useLoaded();

  return <ThemeProvider>{isLoaded ? <MainNavigator /> : null}</ThemeProvider>;
}

// export default function Main() {
//   useEffect(() => {
//     (async () => {
//       console.log('DUPA', globalThis.expo.modules.BenchmarkingExpoModule.addNumbers(21, 37));
//       console.log(
//         'DUPA',
//         await globalThis.expo.modules.BenchmarkingExpoModule.concurrentAddNumbers(12, 73)
//       );
//     })();
//   }, []);
//   return <Text style={{ margin: 200, color: 'white' }}>Hello world!</Text>;
// }
