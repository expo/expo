import { NativeModule } from 'expo';

import type { Notification, NotificationResponse } from './Notifications.types';

export type NotificationsEmitterModuleEvents = {
  onDidReceiveNotification: (notification: Notification) => void;
  onNotificationsDeleted: () => void;
  onDidReceiveNotificationResponse: (response: NotificationResponse) => void;
  onDidClearNotificationResponse: () => void;
};

export class NotificationsEmitterModule extends NativeModule<NotificationsEmitterModuleEvents> {
  getLastNotificationResponse?: () => NotificationResponse | null;
  clearLastNotificationResponse?: () => void;
}
