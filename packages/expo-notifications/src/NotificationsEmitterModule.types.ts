import { ProxyNativeModule } from '@unimodules/core';

import { NotificationResponse } from './Notifications.types';

export interface NotificationsEmitterModule extends ProxyNativeModule {
  getLastNotificationResponseAsync?: () => Promise<NotificationResponse | null>;
}
