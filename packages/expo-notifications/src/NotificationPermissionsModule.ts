import { Platform } from '@unimodules/core';
import { createPermissionHook, PermissionStatus } from 'expo-modules-core';

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

async function resolvePermissionAsync({
  shouldAsk,
}: {
  shouldAsk: boolean;
}): Promise<NotificationPermissionsStatus> {
  if (!Platform.isDOMAvailable) {
    return convertPermissionStatus('denied');
  }

  const { Notification = {} } = window as any;
  if (typeof Notification.requestPermission !== 'undefined') {
    let status = Notification.permission;
    if (shouldAsk) {
      status = await new Promise((resolve, reject) => {
        let resolved = false;
        function resolveOnce(status: string) {
          if (!resolved) {
            resolved = true;
            resolve(status);
          }
        }
        // Some browsers require a callback argument and some return a Promise
        Notification.requestPermission(resolveOnce)
          ?.then(resolveOnce)
          ?.catch(reject);
      });
    }
    return convertPermissionStatus(status);
  } else if (typeof navigator !== 'undefined' && navigator?.permissions?.query) {
    // TODO(Bacon): Support `push` in the future when it's stable.
    const query = await navigator.permissions.query({ name: 'notifications' });
    return convertPermissionStatus(query.state);
  }
  // Platforms like iOS Safari don't support Notifications so return denied.
  return convertPermissionStatus('denied');
}

async function getPermissionsAsync(): Promise<NotificationPermissionsStatus> {
  return resolvePermissionAsync({ shouldAsk: false });
}

async function requestPermissionsAsync(
  request: NativeNotificationPermissionsRequest
): Promise<NotificationPermissionsStatus> {
  return resolvePermissionAsync({ shouldAsk: true });
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
const usePermissions = createPermissionHook({
  getMethod: getPermissionsAsync,
  // @ts-ignore - We need generics for this one
  requestMethod: requestPermissionsAsync,
});

export default {
  addListener: () => {},
  removeListeners: () => {},
  getPermissionsAsync,
  requestPermissionsAsync,
  usePermissions,
} as NotificationPermissionsModule;
