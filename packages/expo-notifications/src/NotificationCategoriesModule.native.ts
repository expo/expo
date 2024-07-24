import { requireNativeModule } from 'expo';

import { NotificationCategoriesModule } from './NotificationCategoriesModule.types';

export default requireNativeModule<NotificationCategoriesModule>(
  'ExpoNotificationCategoriesModule'
);
