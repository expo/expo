import { isRunningInExpoGo } from 'expo';

let didWarn = false;

export const warnOfExpoGoPushUsage = () => {
  if (__DEV__ && isRunningInExpoGo() && !didWarn) {
    didWarn = true;
    console.warn(
      `expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go. Read more at https://docs.expo.dev/develop/development-builds/introduction/.`
    );
  }
};
