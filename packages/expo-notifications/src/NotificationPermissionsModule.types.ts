import type { ProxyNativeModule } from 'expo/internal';

import {
  NotificationPermissionsStatus,
  NativeNotificationPermissionsRequest,
} from './NotificationPermissions.types';

export interface NotificationPermissionsModule extends ProxyNativeModule {
  getPermissionsAsync?: () => Promise<NotificationPermissionsStatus>;
  requestPermissionsAsync?: (
    request: NativeNotificationPermissionsRequest
  ) => Promise<NotificationPermissionsStatus>;
}
