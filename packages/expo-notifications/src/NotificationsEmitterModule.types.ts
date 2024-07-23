import { ProxyNativeModule } from 'expo/internal';

import { NotificationResponse } from './Notifications.types';

export interface NotificationsEmitterModule extends ProxyNativeModule {
  getLastNotificationResponseAsync?: () => Promise<NotificationResponse | null>;
}
