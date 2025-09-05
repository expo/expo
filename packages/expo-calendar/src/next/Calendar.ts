import { UnavailabilityError } from 'expo-modules-core';
import { Platform, processColor } from 'react-native';

import {
  Calendar,
  Attendee,
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
  ModifiableAttendeeProperties,
} from './ExpoCalendar.types';

/**
 * Represents a calendar attendee object.
 */
export class ExpoCalendarAttendee extends InternalExpoCalendar.ExpoCalendarAttendee {
  override async update(details: Partial<ModifiableAttendeeProperties>): Promise<void> {
    if (!super.update) {
      throw new UnavailabilityError('ExpoCalendarAttendee', 'update');
    }
    const nullableDetailsFields = getNullableDetailsFields(details);
    return super.update(stringifyDateValues(details), nullableDetailsFields);
  }

  override async delete(): Promise<void> {
    if (!super.delete) {
      throw new UnavailabilityError('ExpoCalendarAttendee', 'delete');
    }
    await super.delete();
  }
}

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
    return await super.editInCalendarAsync(params ?? null);
  }

  override getOccurrence(recurringEventOptions: RecurringEventOptions = {}): ExpoCalendarEvent {
    const result = super.getOccurrence(stringifyDateValues(recurringEventOptions));
    Object.setPrototypeOf(result, ExpoCalendarEvent.prototype);
    return result;
  }

  override async getAttendeesAsync(): Promise<ExpoCalendarAttendee[]> {
    const attendees = await super.getAttendeesAsync();
    return attendees.map((attendee) => {
      Object.setPrototypeOf(attendee, ExpoCalendarAttendee.prototype);
      return attendee;
    });
  }

  override async createAttendee(attendee: Attendee): Promise<ExpoCalendarAttendee> {
    if (!super.createAttendee) {
      throw new UnavailabilityError('ExpoCalendarEvent', 'createAttendee');
    }
    const newAttendee = await super.createAttendee(attendee);
    Object.setPrototypeOf(newAttendee, ExpoCalendarAttendee.prototype);
    return newAttendee;
  }

  override async update(details: Partial<ModifiableEventProperties>): Promise<void> {
    const nullableDetailsFields = getNullableDetailsFields(details);
    return await super.update(stringifyDateValues(details), nullableDetailsFields);
  }

  override async delete(): Promise<void> {
    await super.delete();
  }

  static override async get(eventId: string): Promise<ExpoCalendarEvent> {
    const event = await InternalExpoCalendar.getEventById(eventId);
    Object.setPrototypeOf(event, ExpoCalendarEvent.prototype);
    return event;
  }
}

/**
 * Represents a calendar reminder object that can be accessed and modified using the Expo Calendar Next API.
 */
export class ExpoCalendarReminder extends InternalExpoCalendar.ExpoCalendarReminder {
  override async update(details: Partial<ModifiableReminderProperties>): Promise<void> {
    const nullableDetailsFields = getNullableDetailsFields(details);
    await super.update(stringifyDateValues(details), nullableDetailsFields);
  }

  static override async get(reminderId: string): Promise<ExpoCalendarReminder> {
    const reminder = await InternalExpoCalendar.getReminderById(reminderId);
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
  override async createEvent(
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
  ): Promise<ExpoCalendarEvent> {
    const newEvent = await super.createEvent(stringifyDateValues(details));
    Object.setPrototypeOf(newEvent, ExpoCalendarEvent.prototype);
    return newEvent;
  }

  override async createReminder(details: Partial<Reminder>): Promise<ExpoCalendarReminder> {
    const newReminder = await super.createReminder(stringifyDateValues(details));
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

  override async update(details: Partial<ModifiableCalendarProperties>): Promise<void> {
    const color = details.color ? processColor(details.color) : undefined;
    const newDetails = { ...details, color: color || undefined };
    return await super.update(newDetails as Partial<ModifiableCalendarProperties>);
  }

  static override async get(calendarId: string): Promise<ExpoCalendar> {
    const calendar = await InternalExpoCalendar.getCalendarById(calendarId);
    Object.setPrototypeOf(calendar, ExpoCalendar.prototype);
    return calendar;
  }
}

/**
 * Gets an instance of the default calendar object.
 * @return An [`ExpoCalendar`](#expocalendar) object that is the user's default calendar.
 */
export function getDefaultCalendar(): ExpoCalendar {
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
export async function getCalendars(type?: EntityTypes): Promise<ExpoCalendar[]> {
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
export async function createCalendar(details: Partial<Calendar> = {}): Promise<ExpoCalendar> {
  const color = details.color ? processColor(details.color) : undefined;
  const newDetails = { ...details, id: undefined, color: color || undefined };
  const createdCalendar = await InternalExpoCalendar.createCalendar(newDetails);
  Object.setPrototypeOf(createdCalendar, ExpoCalendar.prototype);
  return createdCalendar;
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
  PermissionResponse,
  Alarm,
  AlarmLocation,
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
  createEventInCalendarAsync,
  openEventInCalendarAsync,
} from '../Calendar';
export { useCalendarPermissions, useRemindersPermissions } from '../Calendar';
