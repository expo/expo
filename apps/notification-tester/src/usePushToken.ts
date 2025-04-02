import { addPushTokenListener, getDevicePushTokenAsync } from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { registerForPushNotificationsAsync } from './registerForNotifications';

export function usePushToken() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
  const [devicePushToken, setDevicePushToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        setExpoPushToken(token);
      })
      .catch(console.error);

    getDevicePushTokenAsync()
      .then((token) => {
        const tokenString = JSON.stringify(token);
        setDevicePushToken(tokenString);
      })
      .catch(console.error);

    if (Platform.OS === 'android') {
      const subscription = addPushTokenListener((token) => {
        setExpoPushToken(JSON.stringify(token));
      });
      return () => {
        subscription.remove();
      };
    }
  }, []);

  return {
    expoPushToken,
    devicePushToken,
  };
}
