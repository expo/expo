import { requireNativeModule } from 'expo';

import { NotificationChannelGroupManager } from './NotificationChannelGroupManager.types';

export default requireNativeModule<NotificationChannelGroupManager>(
  'ExpoNotificationChannelGroupManager'
);
