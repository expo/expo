import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

export interface NotificationBehavior {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
}

export interface NotificationsHandlerModule extends ProxyNativeModule {
  handleNotificationAsync: (
    notificationId: string,
    notificationBehavior: NotificationBehavior
  ) => Promise<void>;
}

export default (NativeModulesProxy.ExpoNotificationsHandlerModule as any) as NotificationsHandlerModule;
