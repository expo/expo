import { UnavailabilityError } from 'expo';
import { Platform } from 'react-native';

import InternalExpoCalendar from './ExpoCalendar';
import type { PermissionResponse, Source } from './legacy/Calendar';

/**
 * Asks the user to grant permissions for accessing user's calendars.
 * @param writeOnly - On iOS, whether to request write-only access, which allows creating calendar events
 * without reading existing calendars or events. This does not grant permission to create, update, or delete calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export async function requestCalendarPermissions(writeOnly?: boolean): Promise<PermissionResponse> {
  return InternalExpoCalendar.requestCalendarPermissions(writeOnly);
}

/**
 * Checks user's permissions for accessing user's calendars.
 * @param writeOnly - On iOS, whether to check write-only access, which allows creating calendar events
 * without reading existing calendars or events. This does not grant permission to create, update, or delete calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export async function getCalendarPermissions(writeOnly?: boolean): Promise<PermissionResponse> {
  return InternalExpoCalendar.getCalendarPermissions(writeOnly);
}

/**
 * Asks the user to grant permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export async function requestRemindersPermissions(): Promise<PermissionResponse> {
  if (Platform.OS !== 'ios') {
    throw new UnavailabilityError('Calendars', 'requestRemindersPermissions');
  }
  return InternalExpoCalendar.requestRemindersPermissions!();
}

/**
 * Checks user's permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export async function getRemindersPermissions(): Promise<PermissionResponse> {
  if (Platform.OS !== 'ios') {
    throw new UnavailabilityError('Calendars', 'getRemindersPermissions');
  }
  return InternalExpoCalendar.getRemindersPermissions!();
}

/**
 * Gets an array of Source objects with details about the different sources stored on the device.
 * > **Android:** This function is not available on Android. Android does not expose a
 * > first-class calendar sources API. If you need account-like source information, call
 * > `ExpoCalendar.getAll()` and inspect each calendar's `source` field.
 * @returns An array of Source objects representing the sources found.
 * @platform ios
 */
export function getSourcesSync(): Source[] {
  if (Platform.OS !== 'ios') {
    throw new UnavailabilityError('Calendars', 'getSourcesSync');
  }
  return InternalExpoCalendar.getSourcesSync();
}
