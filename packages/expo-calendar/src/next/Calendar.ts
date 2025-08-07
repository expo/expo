import { UnavailabilityError } from 'expo-modules-core';
import { Platform, processColor } from 'react-native';

import {
  Calendar,
  EntityTypes,
  Event,
  RecurringEventOptions,
  Reminder,
  ReminderStatus,
} from '../Calendar';
import InternalExpoCalendar from './ExpoCalendar';
import { stringifyDateValues, stringifyIfDate, getNullableDetailsFields } from '../utils';
import {
  ModifiableEventProperties,
  ModifableReminderProperties,
  ModifableCalendarProperties,
} from './ExpoCalendar.types';


/**
 * Gets an instance of the default calendar object.
 * @return An [ExpoCalendar](#expocalendar) object that is the user's default calendar.
 * @platform ios
 */
export function getDefaultCalendarNext(): ExpoCalendar {
  if (Platform.OS === 'android') return null;
  if (!InternalExpoCalendar.getDefaultCalendar) {
    throw new UnavailabilityError('Calendar', 'getDefaultCalendar');
  }
  const defaultCalendar = InternalExpoCalendar.getDefaultCalendar();
  Object.setPrototypeOf(defaultCalendar, ExpoCalendar.prototype);
  return defaultCalendar;
}

/**
 * Gets an array of [ExpoCalendar](#expocalendar) shared objects with details about the different calendars stored on the device.
 * @param entityType __iOS Only.__ Not required, but if defined, filters the returned calendars to
 * a specific [entity type](#entitytypes). Possible values are `Calendar.EntityTypes.EVENT` (for calendars shown in
 * the Calendar app) and `Calendar.EntityTypes.REMINDER` (for the Reminders app).
 * > **Note:** If not defined, you will need both permissions: **CALENDAR** and **REMINDERS**.
 * @return An array of [ExpoCalendar](#expocalendar) shared objects matching the provided entity type (if provided).
 */
export async function getCalendarsNext(type?: EntityTypes): Promise<any> {
  if (!InternalExpoCalendar.getCalendars) {
    throw new UnavailabilityError('Calendar', 'getCalendars');
  }
  const calendars = await InternalExpoCalendar.getCalendars(type);
  return calendars;
  return calendars.map((calendar) => {
    Object.setPrototypeOf(calendar, ExpoCalendar.prototype);
    return calendar;
  });
}

/**
 * Creates a new calendar on the device, allowing events to be added later and displayed in the OS Calendar app.
 * @param details A map of details for the calendar to be created.
 * @returns An [ExpoCalendar](#expocalendar) object representing the newly created calendar.
 */
export function createCalendarNext(details: Partial<Calendar> = {}): ExpoCalendar {
  if (Platform.OS === 'android') return null;
  if (!InternalExpoCalendar.createCalendarNext) {
    throw new UnavailabilityError('Calendar', 'createCalendarNext');
  }
  const color = details.color ? processColor(details.color) : undefined;
  const newDetails = { ...details, id: undefined, color: color || undefined };
  const createdCalendar = InternalExpoCalendar.createCalendarNext(newDetails);
  Object.setPrototypeOf(createdCalendar, ExpoCalendar.prototype);
  return createdCalendar;
}

/**
 * Lists events from the device's calendar. It can be used to search events in multiple calendars.
 * > **Note:** If you want to search events in a single calendar, you can use [ExpoCalendar.listEvents](#listeventsstartdate-enddate) instead.
 * @param calendarIds An array of calendar IDs to search for events.
 * @param startDate The start date of the time range to search for events.
 * @param endDate The end date of the time range to search for events.
 * @returns An array of [ExpoCalendarEvent](#expocalendarevent) objects representing the events found.
 */
export function listEvents(
  calendarIds: string[],
  startDate: Date,
  endDate: Date
): ExpoCalendarEvent[] {
  if (Platform.OS === 'android') return [];
  if (!InternalExpoCalendar.listEvents) {
    throw new UnavailabilityError('Calendar', 'listEvents');
  }
  return InternalExpoCalendar.listEvents(
    calendarIds,
    stringifyIfDate(startDate),
    stringifyIfDate(endDate)
  );
}

/**
 * Asks the user to grant permissions for accessing user's calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export const requestCalendarPermissionsAsync = InternalExpoCalendar.requestCalendarPermissionsAsync;

/**
 * Check or request permissions to access the calendar.
 * This uses both `getCalendarPermissionsAsync` and `requestCalendarPermissionsAsync` to interact
 * with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Calendar.useCalendarPermissions();
 * ```
 */
export const getCalendarPermissionsAsync = InternalExpoCalendar.getCalendarPermissionsAsync;

/**
 * Asks the user to grant permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export const requestRemindersPermissionsAsync =
  InternalExpoCalendar.requestRemindersPermissionsAsync;

/**
 * Checks user's permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export const getRemindersPermissionsAsync = InternalExpoCalendar.getRemindersPermissionsAsync;

/**
 * Gets an array of Source objects with details about the different sources stored on the device.
 * @returns An array of Source objects representing the sources found.
 * @platform ios
 */
export const getSources = InternalExpoCalendar.getSources;

export type {
  Calendar,
  Event,
  Reminder,
  PermissionResponse,
  Alarm,
  AlarmLocation,
  Attendee,
  CalendarDialogParams,
  DaysOfTheWeek,
  DialogEventResult,
  OpenEventDialogResult,
  OpenEventPresentationOptions,
  PermissionExpiration,
  PermissionHookOptions,
  PresentationOptions,
  RecurrenceRule,
  RecurringEventOptions,
  Source,
} from '../Calendar';
export {
  AlarmMethod,
  AttendeeRole,
  AttendeeStatus,
  AttendeeType,
  Availability,
  CalendarAccessLevel,
  CalendarDialogResultActions,
  CalendarType,
  DayOfTheWeek,
  EntityTypes,
  EventAccessLevel,
  EventStatus,
  Frequency,
  MonthOfTheYear,
  ReminderStatus,
  SourceType,
} from '../Calendar';
export { useCalendarPermissions, useRemindersPermissions } from '../Calendar';
