import React from 'react';

import MainNavigator, { optionalRequire } from './MainNavigator';
let Notifications;
try {
  Notifications = require('expo-notifications');
} catch {
  // do nothing
}

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

  if (!isLoaded) {
    return null;
  }

  return <MainNavigator />;
}
