import { ProxyNativeModule } from 'expo-modules-core';

import { NotificationResponse } from './Notifications.types';

export interface NotificationsEmitterModule extends ProxyNativeModule {
  getLastNotificationResponseAsync?: () => Promise<NotificationResponse | null>;
  getLastNotificationResponse?: () => NotificationResponse | null;
  clearLastNotificationResponseAsync?: () => Promise<void>;
  clearLastNotificationResponse?: () => void;
}
