import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import { PermissionStatus } from 'unimodules-permissions-interface';

import {
  NativeNotificationPermissionsRequest,
  NotificationPermissionsStatus,
} from './NotificationPermissions.types';
import { NotificationPermissionsModule } from './NotificationPermissionsModule.types';

function convertPermissionStatus(
  status?: NotificationPermission | 'prompt'
): NotificationPermissionsStatus {
  switch (status) {
    case 'granted':
      return {
        status: PermissionStatus.GRANTED,
        expires: 'never',
        canAskAgain: false,
        granted: true,
      };
    case 'denied':
      return {
        status: PermissionStatus.DENIED,
        expires: 'never',
        canAskAgain: false,
        granted: false,
      };
    default:
      return {
        status: PermissionStatus.UNDETERMINED,
        expires: 'never',
        canAskAgain: true,
        granted: false,
      };
  }
}

async function resolvePermissionAsync(shouldAsk: boolean): Promise<NotificationPermissionsStatus> {
  if (!canUseDOM) {
    return convertPermissionStatus('denied');
  }

  if (typeof Notification.requestPermission !== 'undefined') {
    let status = Notification.permission;
    if (shouldAsk) {
      status = await Notification.requestPermission();
    }
    return convertPermissionStatus(status);
  } else if (
    typeof navigator === 'undefined' ||
    typeof navigator.permissions === 'undefined' ||
    typeof navigator.permissions.query === 'undefined'
  ) {
    const query = await navigator.permissions.query({ name: 'notifications' });
    return convertPermissionStatus(query.state);
  }
  // Platforms like iOS Safari don't support Notifications so return denied.
  return convertPermissionStatus('denied');
}

export default {
  addListener: () => {},
  removeListeners: () => {},
  async getPermissionsAsync(): Promise<NotificationPermissionsStatus> {
    return resolvePermissionAsync(false);
  },
  async requestPermissionsAsync(
    request: NativeNotificationPermissionsRequest
  ): Promise<NotificationPermissionsStatus> {
    return resolvePermissionAsync(true);
  },
} as NotificationPermissionsModule;
