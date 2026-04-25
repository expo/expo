import { requireNativeModule } from 'expo-modules-core';

import type { NotificationPermissionsModule } from './NotificationPermissionsModule.types';

export default requireNativeModule<NotificationPermissionsModule>(
  'ExpoNotificationPermissionsModule'
);
