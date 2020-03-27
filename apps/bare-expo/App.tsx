import React from 'react';

import MainNavigator from './MainNavigator';
import { createProxy, startAsync, addListener } from './relapse/client';
let Notifications;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // do nothing
}

export default function Main() {
  // @ts-ignore
  if (global.DETOX) {
    React.useEffect(() => {
      addListener(data => {
        if (data.globals) {
          for (const moduleName of data.globals) {
            // @ts-ignore
            global[moduleName] = createProxy(moduleName);
          }
        }
      });

      let stop;
      startAsync().then(_stop => (stop = _stop));

      return () => stop && stop();
    }, []);
  }

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

  return <MainNavigator uriPrefix="bareexpo://" />;
}
