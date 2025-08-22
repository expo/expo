import { UnavailabilityError } from 'expo-modules-core';
import { Platform, processColor } from 'react-native';

import {
  Calendar,
  DialogEventResult,
  EntityTypes,
  Event,
  OpenEventDialogResult,
  RecurringEventOptions,
  Reminder,
  ReminderStatus,
} from '../Calendar';
import InternalExpoCalendar from './ExpoCalendar';
import { stringifyDateValues, stringifyIfDate, getNullableDetailsFields } from '../utils';
import {
  ModifiableEventProperties,
  ModifiableReminderProperties,
  ModifiableCalendarProperties,
  CalendarDialogOpenParamsNext,
  CalendarDialogParamsNext,
} from './ExpoCalendar.types';

/**
 * Represents a calendar attendee object.
 */
export class ExpoCalendarAttendee extends InternalExpoCalendar.ExpoCalendarAttendee {}

/**
 * Represents a calendar event object that can be accessed and modified using the Expo Calendar Next API.
 */
export class ExpoCalendarEvent extends InternalExpoCalendar.ExpoCalendarEvent {
  override async openInCalendarAsync(
    params?: CalendarDialogOpenParamsNext
  ): Promise<OpenEventDialogResult> {
    // We have to pass null here because the core doesn't support skipping the first param
    return super.openInCalendarAsync(params ?? null);
  }

  override async editInCalendarAsync(
    params?: CalendarDialogParamsNext
  ): Promise<DialogEventResult> {
    // We have to pass null here because the core doesn't support skipping the first param
    return super.editInCalendarAsync(params ?? null);
  }

  override getOccurrence(recurringEventOptions: RecurringEventOptions = {}): ExpoCalendarEvent {
    const result = super.getOccurrence(stringifyDateValues(recurringEventOptions));
    Object.setPrototypeOf(result, ExpoCalendarEvent.prototype);
    return result;
  }

  override async getAttendeesAsync(): Promise<ExpoCalendarAttendee[]> {
    return super.getAttendeesAsync();
  }

  override update(details: Partial<ModifiableEventProperties>): void {
    const nullableDetailsFields = getNullableDetailsFields(details);
    return super.update(stringifyDateValues(details), nullableDetailsFields);
  }

  override delete(): void {
    super.delete();
  }

  static override get(eventId: string): ExpoCalendarEvent {
    const event = InternalExpoCalendar.getEventById(eventId);
    Object.setPrototypeOf(event, ExpoCalendarEvent.prototype);
    return event;
  }
}

/**
 * Represents a calendar reminder object that can be accessed and modified using the Expo Calendar Next API.
 */
export class ExpoCalendarReminder extends InternalExpoCalendar.ExpoCalendarReminder {
  override update(details: Partial<ModifiableReminderProperties>): void {
    const nullableDetailsFields = getNullableDetailsFields(details);
    super.update(stringifyDateValues(details), nullableDetailsFields);
  }

  static override get(reminderId: string): ExpoCalendarReminder {
    const reminder = InternalExpoCalendar.getReminderById(reminderId);
    Object.setPrototypeOf(reminder, ExpoCalendarReminder.prototype);
    return reminder;
  }
}

/**
 * Represents a calendar object that can be accessed and modified using the Expo Calendar Next API.
 *
 * This class provides properties and methods for interacting with a specific calendar on the device,
 * such as retrieving its events, updating its details, and accessing its metadata.
 */
export class ExpoCalendar extends InternalExpoCalendar.ExpoCalendar {
  override createEvent(
    details: Partial<
      Omit<
        Event,
        | 'creationDate'
        | 'lastModifiedDate'
        | 'originalStartDate'
        | 'isDetached'
        | 'status'
        | 'organizer'
      >
    >
  ): ExpoCalendarEvent {
    const newEvent = super.createEvent(stringifyDateValues(details));
    Object.setPrototypeOf(newEvent, ExpoCalendarEvent.prototype);
    return newEvent;
  }

  override createReminder(details: Partial<Reminder>): ExpoCalendarReminder {
    const newReminder = super.createReminder(stringifyDateValues(details));
    Object.setPrototypeOf(newReminder, ExpoCalendarReminder.prototype);
    return newReminder;
  }

  override async listEvents(startDate: Date, endDate: Date): Promise<ExpoCalendarEvent[]> {
    if (!startDate) {
      throw new Error('listEvents must be called with a startDate (date) to search for events');
    }
    if (!endDate) {
      throw new Error('listEvents must be called with an endDate (date) to search for events');
    }
    const events = await super.listEvents(stringifyIfDate(startDate), stringifyIfDate(endDate));
    return events.map((event) => {
      Object.setPrototypeOf(event, ExpoCalendarEvent.prototype);
      return event;
    });
  }

  override async listReminders(
    startDate: Date | null = null,
    endDate: Date | null = null,
    status: ReminderStatus | null = null
  ): Promise<ExpoCalendarReminder[]> {
    const reminders = await super.listReminders(
      startDate ? stringifyIfDate(startDate) : null,
      endDate ? stringifyIfDate(endDate) : null,
      status
    );
    return reminders.map((reminder) => {
      Object.setPrototypeOf(reminder, ExpoCalendarReminder.prototype);
      return reminder;
    });
  }

  override update(details: Partial<ModifiableCalendarProperties>): void {
    const color = details.color ? processColor(details.color) : undefined;
    const newDetails = { ...details, color: color || undefined };
    return super.update(newDetails as Partial<ModifiableCalendarProperties>);
  }

  static override get(calendarId: string): ExpoCalendar {
    const calendar = InternalExpoCalendar.getCalendarById(calendarId);
    Object.setPrototypeOf(calendar, ExpoCalendar.prototype);
    return calendar;
  }
}

/**
 * Gets an instance of the default calendar object.
 * @return An [`ExpoCalendar`](#expocalendar) object that is the user's default calendar.
 */
export function getDefaultCalendarNext(): ExpoCalendar {
  if (Platform.OS === 'android' || !InternalExpoCalendar.getDefaultCalendar) {
    throw new UnavailabilityError('Calendar', 'getDefaultCalendar');
  }
  const defaultCalendar = InternalExpoCalendar.getDefaultCalendar();
  Object.setPrototypeOf(defaultCalendar, ExpoCalendar.prototype);
  return defaultCalendar;
}

/**
 * Gets an array of [`ExpoCalendar`](#expocalendar) shared objects with details about the different calendars stored on the device.
 * @param entityType __iOS Only.__ Not required, but if defined, filters the returned calendars to
 * a specific [entity type](#entitytypes). Possible values are `Calendar.EntityTypes.EVENT` (for calendars shown in
 * the Calendar app) and `Calendar.EntityTypes.REMINDER` (for the Reminders app).
 * > **Note:** If not defined, you will need both permissions: **CALENDAR** and **REMINDERS**.
 * @return An array of [`ExpoCalendar`](#expocalendar) shared objects matching the provided entity type (if provided).
 */
export async function getCalendarsNext(type?: EntityTypes): Promise<ExpoCalendar[]> {
  if (!InternalExpoCalendar.getCalendars) {
    throw new UnavailabilityError('Calendar', 'getCalendars');
  }
  const calendars = await InternalExpoCalendar.getCalendars(type);
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
export function createCalendar(details: Partial<Calendar> = {}): ExpoCalendar {
  const color = details.color ? processColor(details.color) : undefined;
  const newDetails = { ...details, id: undefined, color: color || undefined };
  const createdCalendar = InternalExpoCalendar.createCalendar(newDetails);
  Object.setPrototypeOf(createdCalendar, ExpoCalendar.prototype);
  return createdCalendar;
}

/**
 * Lists events from the device's calendar. It can be used to search events in multiple calendars.
 * > **Note:** If you want to search events in a single calendar, you can use [`ExpoCalendar.listEvents`](#listeventsstartdate-enddate) instead.
 * @param calendars An array of calendar IDs to search for events or [`ExpoCalendar`](#expocalendar) objects.
 * @param startDate The start date of the time range to search for events.
 * @param endDate The end date of the time range to search for events.
 * @returns An array of [`ExpoCalendarEvent`](#expocalendarevent) objects representing the events found.
 */
export async function listEvents(
  calendars: string[] | ExpoCalendar[],
  startDate: Date,
  endDate: Date
): Promise<ExpoCalendarEvent[]> {
  if (!InternalExpoCalendar.listEvents) {
    throw new UnavailabilityError('Calendar', 'listEvents');
  }
  const calendarIds: string[] =
    Array.isArray(calendars) && calendars.length > 0 && typeof calendars[0] !== 'string'
      ? (calendars as ExpoCalendar[]).map((calendar) => calendar.id)
      : (calendars as string[]);
  return InternalExpoCalendar.listEvents(
    calendarIds,
    stringifyIfDate(startDate),
    stringifyIfDate(endDate)
  );
}

/**
 * Gets an event by its ID.
 * @param eventId The ID of the event to get.
 * @returns An [`ExpoCalendarEvent`](#expocalendarevent) object representing the event.
 */
export function getEventById(eventId: string): ExpoCalendarEvent {
  if (!InternalExpoCalendar.getEventById) {
    throw new UnavailabilityError('Calendar', 'getEventById');
  }
  const event = InternalExpoCalendar.getEventById(eventId);
  Object.setPrototypeOf(event, ExpoCalendarEvent.prototype);
  return event;
}

/**
 * Gets a reminder by its ID.
 * @param reminderId The ID of the reminder to get.
 * @returns An [`ExpoCalendarReminder`](#expocalendarreminder) object representing the reminder.
 * @platform ios
 */
export function getReminderById(reminderId: string): ExpoCalendarReminder {
  if (!InternalExpoCalendar.getReminderById) {
    throw new UnavailabilityError('Calendar', 'getReminderById');
  }
  const reminder = InternalExpoCalendar.getReminderById(reminderId);
  Object.setPrototypeOf(reminder, ExpoCalendarReminder.prototype);
  return reminder;
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
 */
export const requestRemindersPermissionsAsync =
  InternalExpoCalendar.requestRemindersPermissionsAsync;

/**
 * Checks user's permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export const getRemindersPermissionsAsync = InternalExpoCalendar.getRemindersPermissionsAsync;

/**
 * Gets an array of Source objects with details about the different sources stored on the device.
 * @returns An array of Source objects representing the sources found.
 */
export const getSources = InternalExpoCalendar.getSources;

export type {
  ModifiableEventProperties,
  ModifiableReminderProperties,
  ModifiableCalendarProperties,
} from './ExpoCalendar.types';

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
