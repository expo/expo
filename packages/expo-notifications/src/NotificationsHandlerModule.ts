import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

import { NotificationBehavior } from './Notifications.types';

export interface NotificationsHandlerModule extends ProxyNativeModule {
  handleNotificationAsync: (
    notificationId: string,
    notificationBehavior: NotificationBehavior
  ) => Promise<void>;
}

export default (NativeModulesProxy.ExpoNotificationsHandlerModule as any) as NotificationsHandlerModule;
