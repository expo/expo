import { Platform } from 'expo-modules-core';

export default {
  get name(): string {
    return 'ExpoSystemUI';
  },
  getBackgroundColorAsync() {
    if (Platform.isDOMAvailable) {
      return document.body.style.backgroundColor;
    } else {
      return null;
    }
  },
  setBackgroundColorAsync(color: string) {
    if (Platform.isDOMAvailable) {
      document.body.style.backgroundColor = color;
    }
  },
};
