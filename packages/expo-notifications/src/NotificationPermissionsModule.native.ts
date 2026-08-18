import { requireNativeModule } from 'expo';

import type { NotificationPermissionsModule } from './NotificationPermissionsModule.types';

export default requireNativeModule<NotificationPermissionsModule>(
  'ExpoNotificationPermissionsModule'
);
