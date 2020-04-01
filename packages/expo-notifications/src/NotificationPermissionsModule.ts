import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

import {
  NotificationPermissionsStatus,
  NativeNotificationPermissionsRequest,
} from './NotificationPermissions.types';

export interface NotificationPermissionsModule extends ProxyNativeModule {
  getPermissionsAsync: () => Promise<NotificationPermissionsStatus>;
  requestPermissionsAsync: (
    request: NativeNotificationPermissionsRequest
  ) => Promise<NotificationPermissionsStatus>;
}

export default (NativeModulesProxy.ExpoNotificationPermissionsModule as any) as NotificationPermissionsModule;
