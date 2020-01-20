import { Platform } from '@unimodules/core';
import NotificationPermissionsModule, {
  IosNotificationPermissionsRequest,
  AndroidNotificationPermissionRequest,
} from './NotificationPermissionsModule';

export {
  AndroidImportance,
  AndroidInterruptionFilter,
  IosAlertStyle,
  IosAllowsPreviews,
  IosAuthorizationStatus,
} from './NotificationPermissionsModule';

export async function getPermissionsAsync() {
  return await NotificationPermissionsModule.getPermissionsAsync();
}

export interface NotificationPermissionsRequest {
  ios?: IosNotificationPermissionsRequest;
  android?: AndroidNotificationPermissionRequest;
}

export async function requestPermissionsAsync(permissions?: NotificationPermissionsRequest) {
  const requestedPermissions = permissions ?? {
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  };
  const requestedPlatformPermissions = requestedPermissions[Platform.OS];
  return await NotificationPermissionsModule.requestPermissionsAsync(requestedPlatformPermissions);
}
