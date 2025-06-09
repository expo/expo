import { isRunningInExpoGo } from 'expo';
import { Platform } from 'expo-modules-core';

let didWarn = false;

export const warnOfExpoGoPushUsage = () => {
  if (__DEV__ && isRunningInExpoGo() && !didWarn) {
    didWarn = true;
    const message = `expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go. Read more at https://docs.expo.dev/develop/development-builds/introduction/.`;

    if (Platform.OS === 'android') {
      console.error(message);
    } else {
      console.warn(message);
    }
  }
};
