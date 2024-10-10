import { ProxyNativeModule } from 'expo-modules-core';

import { Notification, NotificationContentInput } from './Notifications.types';

export interface NotificationPresenterModule extends ProxyNativeModule {
  getPresentedNotificationsAsync?: () => Promise<Notification[]>;
  dismissNotificationAsync?: (identifier: string) => Promise<void>;
  dismissAllNotificationsAsync?: () => Promise<void>;
}
