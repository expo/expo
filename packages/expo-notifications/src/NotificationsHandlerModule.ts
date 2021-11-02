import { Platform } from 'expo-modules-core';

import { NotificationsHandlerModule } from './NotificationsHandlerModule.types';

let warningHasBeenShown = false;

export default {
  addListener: () => {
    if (!warningHasBeenShown) {
      console.warn(
        `[expo-notifications] Notifications handling is not yet fully supported on ${Platform.OS}. Handling notifications will have no effect.`
      );
      warningHasBeenShown = true;
    }
  },
  removeListeners: () => {},
} as NotificationsHandlerModule;
