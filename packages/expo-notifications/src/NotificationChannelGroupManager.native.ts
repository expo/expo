import { requireNativeModule } from 'expo';

import type { NotificationChannelGroupManager } from './NotificationChannelGroupManager.types';

export default requireNativeModule<NotificationChannelGroupManager>(
  'ExpoNotificationChannelGroupManager'
);
