import { requireNativeModule } from 'expo-modules-core';

import { NotificationChannelGroupManager } from './NotificationChannelGroupManager.types';

export default requireNativeModule<NotificationChannelGroupManager>(
  'ExpoNotificationChannelGroupManager'
);
