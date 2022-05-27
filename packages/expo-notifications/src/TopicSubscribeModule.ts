import { Platform } from 'expo-modules-core';

import { TopicSubscribeModule } from './TopicSubscribeModule.types';

let warningHasBeenShown = false;

export default {
  addListener: () => {
    if (!warningHasBeenShown) {
      console.warn(
        `[expo-notifications] Subscribing to broadcast topics is supported only on Android.`
      );
      warningHasBeenShown = true;
    }
  },
  removeListeners: () => {},
} as TopicSubscribeModule;
