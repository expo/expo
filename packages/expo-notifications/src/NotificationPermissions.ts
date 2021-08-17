import { createPermissionHook, Platform, UnavailabilityError } from 'expo-modules-core';

import {
  NotificationPermissionsRequest,
  NotificationPermissionsStatus,
} from './NotificationPermissions.types';
import NotificationPermissionsModule from './NotificationPermissionsModule';

export async function getPermissionsAsync() {
  if (!NotificationPermissionsModule.getPermissionsAsync) {
    throw new UnavailabilityError('Notifications', 'getPermissionsAsync');
  }

  return await NotificationPermissionsModule.getPermissionsAsync();
}

export async function requestPermissionsAsync(permissions?: NotificationPermissionsRequest) {
  if (!NotificationPermissionsModule.requestPermissionsAsync) {
    throw new UnavailabilityError('Notifications', 'requestPermissionsAsync');
  }

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

// @needsAudit
/**
 * Check or request permissions to send and receive push notifications.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Notifications.usePermissions();
 * ```
 */
export const usePermissions = createPermissionHook<
  NotificationPermissionsStatus,
  NotificationPermissionsRequest
>({
  requestMethod: requestPermissionsAsync,
  getMethod: getPermissionsAsync,
});
