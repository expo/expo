import { Platform } from 'expo-modules-core';

import { PushTokenManagerModule } from './PushTokenManager.types';

let warningHasBeenShown = false;

export default {
  addListener: () => {
    if (!warningHasBeenShown) {
      console.warn(
        `[expo-notifications] Listening to push token changes is not yet fully supported on ${Platform.OS}. Adding a listener will have no effect.`
      );
      warningHasBeenShown = true;
    }
    return {
      remove: () => {},
    };
  },
  removeListener: () => {},
  removeAllListeners: () => {},
  emit: () => {},
  listenerCount: () => 0,
} as PushTokenManagerModule;
