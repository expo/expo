import { UnavailabilityError } from 'expo';
import { Platform, processColor } from 'react-native';

import { ExpoCalendar, type ExpoCalendarEvent } from './Calendar';
import InternalExpoCalendar from './ExpoCalendar';
import type { Calendar, EntityTypes, PermissionResponse, Source } from './legacy/Calendar';
import { stringifyIfDate } from './utils';

/**
 * Gets an instance of the default calendar object.
 *
 * > **iOS 17+:** With write-only calendar access, this returns EventKit's virtual calendar,
 * > which can be used to create events but does not expose existing calendar data.
 *
 * > **Android:** This function is not available on Android. Android does not expose a single
 * > system-managed default calendar. Use `Calendar.getCalendars()` and choose an appropriate writable
 * > calendar for your app; `isPrimary` can help identify per-account primary calendars.
 * @return An [`ExpoCalendar`](#expocalendar) object that is the user's default calendar.
 * @platform ios
 */
export function getDefaultCalendarSync(): ExpoCalendar {
  if (Platform.OS === 'android' || !InternalExpoCalendar.getDefaultCalendarSync) {
    throw new UnavailabilityError('Calendar', 'getDefaultCalendar');
  }
  const defaultCalendar = InternalExpoCalendar.getDefaultCalendarSync();
  return Object.setPrototypeOf(defaultCalendar, ExpoCalendar.prototype);
}

/**
 * Gets an array of [`ExpoCalendar`](#expocalendar) shared objects with details about the
 * calendars available to the app.
 *
 * > **iOS 17+:** With write-only calendar access, requesting `EntityTypes.EVENT` returns a
 * > single virtual calendar, which can be used to create events but does not expose the user's
 * > real calendars.
 *
 * @param entityType __iOS Only.__ Not required, but if defined, filters the returned calendars to a specific [entity type](#entitytypes).
 * > **Note:** If not defined, both calendar (write-only is enough) and reminders permissions are required.
 * @return An array of [`ExpoCalendar`](#expocalendar) shared objects matching the provided entity type, if provided.
 */
export async function getCalendars(entityType?: EntityTypes): Promise<ExpoCalendar[]> {
  if (!InternalExpoCalendar.getCalendars) {
    throw new UnavailabilityError('Calendar', 'getCalendars');
  }
  const calendars = await InternalExpoCalendar.getCalendars(entityType);
  return calendars.map((calendar) => {
    Object.setPrototypeOf(calendar, ExpoCalendar.prototype);
    return calendar;
  });
}

/**
 * Creates a new calendar on the device, allowing events to be added later and displayed in the OS Calendar app.
 * @param details A map of details for the calendar to be created.
 * @returns An [`ExpoCalendar`](#expocalendar) object representing the newly created calendar.
 */
export async function createCalendar(details: Partial<Calendar> = {}): Promise<ExpoCalendar> {
  const color = details.color ? processColor(details.color) : undefined;
  const newDetails = { ...details, id: undefined, color: color || undefined };
  const createdCalendar = await InternalExpoCalendar.createCalendar(newDetails);
  Object.setPrototypeOf(createdCalendar, ExpoCalendar.prototype);
  return createdCalendar;
}

/**
 * Presents the OS calendar picker and returns the selected calendar.
 * @return An [`ExpoCalendar`](#expocalendar) object or `null` when the picker is cancelled.
 * @platform ios
 */
export async function presentPicker(): Promise<ExpoCalendar | null> {
  if (!InternalExpoCalendar.presentPicker) {
    throw new UnavailabilityError('Calendar', 'presentPicker');
  }
  const calendar = await InternalExpoCalendar.presentPicker();
  if (calendar) {
    Object.setPrototypeOf(calendar, ExpoCalendar.prototype);
  }
  return calendar;
}

/**
 * Lists events from the device's calendar. It can be used to search events in multiple calendars.
 * > **Note:** If you want to search events in a single calendar, you can use [`ExpoCalendar.listEvents`](#listeventsstartdate-enddate) instead.
 * @param calendars An array of calendar IDs (`string[]`) or [`ExpoCalendar`](#expocalendar) objects to search for events.
 * @param startDate The start date of the time range to search for events.
 * @param endDate The end date of the time range to search for events.
 * @returns An array of [`ExpoCalendarEvent`](#expocalendarevent) objects representing the events found.
 */
export async function listEvents(
  calendars: (string | ExpoCalendar)[],
  startDate: Date,
  endDate: Date
): Promise<ExpoCalendarEvent[]> {
  if (!InternalExpoCalendar.listEvents) {
    throw new UnavailabilityError('Calendar', 'listEvents');
  }
  const calendarIds = Array.isArray(calendars)
    ? calendars.map((c) => (typeof c === 'string' ? c : c.id))
    : [];
  return InternalExpoCalendar.listEvents(
    calendarIds,
    stringifyIfDate(startDate),
    stringifyIfDate(endDate)
  );
}

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
    throw new UnavailabilityError('Calendar', 'requestRemindersPermissions');
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
    throw new UnavailabilityError('Calendar', 'getRemindersPermissions');
  }
  return InternalExpoCalendar.getRemindersPermissions!();
}

/**
 * Gets an array of Source objects with details about the different sources stored on the device.
 * > **Android:** This function is not available on Android. Android does not expose a
 * > first-class calendar sources API. If you need account-like source information, call
 * > `Calendar.getCalendars()` and inspect each calendar's `source` field.
 * @returns An array of Source objects representing the sources found.
 * @platform ios
 */
export function getSourcesSync(): Source[] {
  if (Platform.OS !== 'ios') {
    throw new UnavailabilityError('Calendar', 'getSourcesSync');
  }
  return InternalExpoCalendar.getSourcesSync();
}
