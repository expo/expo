import { NativeModule } from 'expo';

import type { Notification, NotificationBehavior } from './Notifications.types';

export type NotificationsHandlerModuleEvents = {
  onHandleNotification: (event: { id: string; notification: Notification }) => void;
  onHandleNotificationTimeout: (event: { id: string; notification: Notification }) => void;
};

export class NotificationsHandlerModule extends NativeModule<NotificationsHandlerModuleEvents> {
  handleNotificationAsync?: (
    notificationId: string,
    notificationBehavior: NotificationBehavior
  ) => Promise<void>;
}
