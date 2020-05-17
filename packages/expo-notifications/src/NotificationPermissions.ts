import { Platform } from '@unimodules/core';

import { NotificationPermissionsRequest } from './NotificationPermissions.types';
import NotificationPermissionsModule from './NotificationPermissionsModule';

export async function getPermissionsAsync() {
  return await NotificationPermissionsModule.getPermissionsAsync();
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
