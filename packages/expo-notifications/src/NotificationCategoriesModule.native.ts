import { requireNativeModule } from 'expo-modules-core';

import type { NotificationCategoriesModule } from './NotificationCategoriesModule.types';

export default requireNativeModule<NotificationCategoriesModule>(
  'ExpoNotificationCategoriesModule'
);
