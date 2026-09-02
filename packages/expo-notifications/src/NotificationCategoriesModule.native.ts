import { requireNativeModule } from 'expo';

import type { NotificationCategoriesModule } from './NotificationCategoriesModule.types';

export default requireNativeModule<NotificationCategoriesModule>(
  'ExpoNotificationCategoriesModule'
);
