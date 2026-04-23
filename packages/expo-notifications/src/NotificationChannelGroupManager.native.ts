import { requireNativeModule } from 'expo-modules-core';

import type { NotificationChannelGroupManager } from './NotificationChannelGroupManager.types';

export default requireNativeModule<NotificationChannelGroupManager>(
  'ExpoNotificationChannelGroupManager'
);
