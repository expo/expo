import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

export interface BaseNotificationBehavior {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
}

export interface AndroidNotificationBehavior extends BaseNotificationBehavior {
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
}

export interface IosNotificationBehavior extends BaseNotificationBehavior {}

export type NativeNotificationBehavior = AndroidNotificationBehavior | IosNotificationBehavior;

export interface NotificationsHandlerModule extends ProxyNativeModule {
  handleNotificationAsync: (
    notificationId: string,
    notificationBehavior: NativeNotificationBehavior
  ) => Promise<void>;
}

export default (NativeModulesProxy.ExpoNotificationsHandlerModule as any) as NotificationsHandlerModule;
