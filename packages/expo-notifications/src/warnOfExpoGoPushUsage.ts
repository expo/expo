import { isRunningInExpoGo } from 'expo';
import { Platform } from 'expo-modules-core';

let didWarn = false;

export const warnOfExpoGoPushUsage = () => {
  if (isRunningInExpoGo() && !didWarn) {
    const message = `expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go. Learn more at https://docs.expo.dev/develop/development-builds/introduction/.`;

    if (Platform.OS === 'android') {
      throw new Error(message);
    } else if (__DEV__) {
      didWarn = true;
      console.warn(message);
    }
  }
};
