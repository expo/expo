import { requireNativeModule } from 'expo-modules-core';

import { NotificationPermissionsModule } from './NotificationPermissionsModule.types';

export default requireNativeModule<NotificationPermissionsModule>(
  'ExpoNotificationPermissionsModule'
);
