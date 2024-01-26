import { requireNativeModule } from 'expo-modules-core';

import { NotificationCategoriesModule } from './NotificationCategoriesModule.types';

export default requireNativeModule<NotificationCategoriesModule>(
  'ExpoNotificationCategoriesModule'
);
