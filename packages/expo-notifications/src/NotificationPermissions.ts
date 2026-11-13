import { PermissionStatus, Platform, UnavailabilityError } from 'expo';
import type { PermissionResponse } from 'expo';

import type { NotificationPermissionsRequest } from './NotificationPermissions.types';
import NotificationPermissionsModule from './NotificationPermissionsModule';

/**
 * Calling this function checks current permissions settings related to notifications.
 * It lets you verify whether the app is currently allowed to display alerts, play sounds, etc.
 * There is no user-facing effect of calling this.
 * @return It returns a `Promise` resolving to an object represents permission settings ([`NotificationPermissionsStatus`](#notificationpermissionsstatus)).
 * On iOS, make sure you [properly interpret the permissions response](#interpret-the-ios-permissions-response).
 * @example Check if the app is allowed to send any type of notifications (interrupting and non-interrupting–provisional on iOS).
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * export async function allowsNotificationsAsync() {
 *   const settings = await Notifications.getPermissionsAsync();
 *   return (
 *     settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
 *   );
 * }
 * ```
 * @header permissions
 */
export async function getPermissionsAsync() {
  if (!NotificationPermissionsModule.getPermissionsAsync) {
    throw new UnavailabilityError('Notifications', 'getPermissionsAsync');
  }

  return await NotificationPermissionsModule.getPermissionsAsync();
}

/**
 * Prompts the user for notification permissions according to request. **Request defaults to asking the user to allow displaying alerts,
 * setting badge count and playing sounds**.
 * @param permissions An object representing configuration for the request scope.
 * @return It returns a Promise resolving to an object represents permission settings ([`NotificationPermissionsStatus`](#notificationpermissionsstatus)).
 * On iOS, make sure you [properly interpret the permissions response](#interpret-the-ios-permissions-response).
 * @example Prompts the user to allow the app to show alerts, play sounds, set badge count and let Siri read out messages through AirPods.
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * export function requestPermissionsAsync() {
 *   return Notifications.requestPermissionsAsync({
 *     ios: {
 *       allowAlert: true,
 *       allowBadge: true,
 *       allowSound: true,
 *     },
 *   });
 * }
 * ```
 * @header permissions
 */
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
  const requestedPlatformPermissions =
    requestedPermissions[Platform.OS as keyof typeof requestedPermissions];
  // TODO(@kitten): This never checks whether the configuration object is undefined
  return await NotificationPermissionsModule.requestPermissionsAsync(requestedPlatformPermissions!);
}

const GRANTED_EXACT_ALARM_RESPONSE: PermissionResponse = {
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: true,
  expires: 'never',
};

/**
 * Checks whether the app can schedule exact alarms. Has no user-facing effect.
 * Without this permission, scheduled notifications arrive at an approximate time,
 * and `delivery: 'alarmClock'` falls back to `'bestEffort'`.
 *
 * Android 14 (API level 34) and later deny the permission by default for newly installed apps.
 * It is always granted below Android 12 (API level 31), and on Android 13 (API level 33) and later for apps that declare
 * `android.permission.USE_EXACT_ALARM`.
 * @return The permission response. If the permission is denied and the app does not declare
 * `android.permission.SCHEDULE_EXACT_ALARM`, `canAskAgain` is `false`.
 * On iOS and web, the response is always granted.
 * @platform android
 * @header permissions
 */
export async function getExactAlarmPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS !== 'android') {
    return GRANTED_EXACT_ALARM_RESPONSE;
  }
  if (!NotificationPermissionsModule.getExactAlarmPermissionsAsync) {
    throw new UnavailabilityError('Notifications', 'getExactAlarmPermissionsAsync');
  }

  return await NotificationPermissionsModule.getExactAlarmPermissionsAsync();
}

/**
 * Opens the system settings screen where the user can allow exact alarms, and resolves when the user returns to the app.
 * Resolves immediately if the permission is already granted, including below Android 12 (API level 31).
 * Rejects if the app does not declare `android.permission.SCHEDULE_EXACT_ALARM`.
 * Declare it with the [`android.permissions`](/versions/latest/config/app/#permissions) property in the app config.
 *
 * > **Note:** If the user revokes the permission on the settings screen, Android restarts the app and the `Promise` never resolves.
 * > Call [`getExactAlarmPermissionsAsync`](#getexactalarmpermissionsasync) on the next launch.
 * @return The permission response. On iOS and web, the response is always granted.
 * @platform android
 * @header permissions
 */
export async function requestExactAlarmPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS !== 'android') {
    return GRANTED_EXACT_ALARM_RESPONSE;
  }
  if (!NotificationPermissionsModule.requestExactAlarmPermissionsAsync) {
    throw new UnavailabilityError('Notifications', 'requestExactAlarmPermissionsAsync');
  }

  return await NotificationPermissionsModule.requestExactAlarmPermissionsAsync();
}
