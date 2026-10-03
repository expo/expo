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
 * Checks whether the app can schedule exact alarms. Without this permission, scheduled notifications are delivered
 * at an approximate time, and the `delivery: 'alarmClock'` trigger option falls back to `'bestEffort'`.
 *
 * The permission applies to Android 12 (API level 31) and later. Android 14 (API level 34) and later deny it by default
 * for newly installed apps. On earlier Android versions, and for apps that declare
 * `android.permission.USE_EXACT_ALARM`, the permission is always granted. There is no user-facing effect of calling this function.
 *
 * To request the permission, the app must declare `android.permission.SCHEDULE_EXACT_ALARM`, for example with the
 * [`android.permissions`](/versions/latest/config/app/#permissions) property in the app config.
 * If the app does not declare it and the permission is denied, the response has `canAskAgain: false`.
 * @return A `Promise` that resolves to the permission response. On iOS and web, it always resolves with a granted response.
 * @platform android
 * @example
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * export async function canScheduleExactAlarmsAsync() {
 *   const { granted } = await Notifications.getExactAlarmPermissionsAsync();
 *   return granted;
 * }
 * ```
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
 * Asks the user to allow the app to schedule exact alarms. The function opens the system settings screen
 * for the permission and resolves when the user returns to the app.
 *
 * The app must declare `android.permission.SCHEDULE_EXACT_ALARM`, for example with the
 * [`android.permissions`](/versions/latest/config/app/#permissions) property in the app config.
 * Otherwise, the returned `Promise` rejects.
 * The function resolves immediately if the permission is already granted, including on Android versions earlier than 12.
 *
 * > **Note:** If the user revokes the permission on the settings screen, Android restarts the app.
 * > In this case, the `Promise` may never resolve. Call [`getExactAlarmPermissionsAsync`](#getexactalarmpermissionsasync) on the next launch.
 * @return A `Promise` that resolves to the permission response after the user returns to the app.
 * On iOS and web, it always resolves with a granted response.
 * @platform android
 * @example
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * export async function ensureExactAlarmPermissionAsync() {
 *   const current = await Notifications.getExactAlarmPermissionsAsync();
 *   if (current.granted || !current.canAskAgain) {
 *     return current.granted;
 *   }
 *   const { granted } = await Notifications.requestExactAlarmPermissionsAsync();
 *   return granted;
 * }
 * ```
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
