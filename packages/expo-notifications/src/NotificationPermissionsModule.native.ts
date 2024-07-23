import { requireNativeModule } from 'expo';

import { NotificationPermissionsModule } from './NotificationPermissionsModule.types';

export default requireNativeModule<NotificationPermissionsModule>(
  'ExpoNotificationPermissionsModule'
);
