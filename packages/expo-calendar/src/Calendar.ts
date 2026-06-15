import { createPermissionHook, PermissionStatus, type PermissionHookOptions } from 'expo';
import { UnavailabilityError } from 'expo-modules-core';
import { Platform, processColor } from 'react-native';

import InternalExpoCalendar from './ExpoCalendar';
import type {
  ModifiableEventProperties,
  ModifiableReminderProperties,
  ModifiableCalendarProperties,
  ModifiableAttendeeProperties,
  AddEventWithFormOptions,
} from './ExpoCalendar.types';
import type {
  Calendar,
  Attendee,
  DialogEventResult,
  EntityTypes,
  Event,
  RecurringEventOptions,
  Reminder,
  ReminderStatus,
  PermissionResponse,
  Source,
} from './legacy/Calendar';
import { stringifyDateValues, stringifyIfDate, getNullableDetailsFields } from './utils';

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
  override getOccurrenceSync(recurringEventOptions: RecurringEventOptions = {}): ExpoCalendarEvent {
    const result = super.getOccurrenceSync(stringifyDateValues(recurringEventOptions));
    Object.setPrototypeOf(result, ExpoCalendarEvent.prototype);
    return result;
  }

  override async getAttendees(): Promise<ExpoCalendarAttendee[]> {
    const attendees = await super.getAttendees();
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
 * @platform ios
 */
export class ExpoCalendarReminder extends InternalExpoCalendar.ExpoCalendarReminder {
  override async update(details: Partial<ModifiableReminderProperties>): Promise<void> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('ExpoCalendarReminder', 'update');
    }
    const nullableDetailsFields = getNullableDetailsFields(details);
    await super.update(stringifyDateValues(details), nullableDetailsFields);
  }

  override async delete(): Promise<void> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('ExpoCalendarReminder', 'delete');
    }
    await super.delete();
  }

  static override async get(reminderId: string): Promise<ExpoCalendarReminder> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('ExpoCalendarReminder', 'get');
    }
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
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('ExpoCalendar', 'createReminder');
    }
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
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('ExpoCalendar', 'listReminders');
    }
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

  override async addEventWithForm(options?: AddEventWithFormOptions): Promise<DialogEventResult> {
    if (!super.addEventWithForm) {
      throw new UnavailabilityError('ExpoCalendar', 'addEventWithForm');
    }
    return super.addEventWithForm(options && stringifyDateValues(options));
  }

  static override async get(calendarId: string): Promise<ExpoCalendar> {
    const calendar = await InternalExpoCalendar.getCalendarById(calendarId);
    Object.setPrototypeOf(calendar, ExpoCalendar.prototype);
    return calendar;
  }
}

/**
 * Gets an instance of the default calendar object.
 * > **Android:** This function is not available on Android. Android does not expose a single
 * > system-managed default calendar. Use `getCalendars()` and choose an appropriate writable
 * > calendar for your app; `isPrimary` can help identify per-account primary calendars.
 * @return An [`ExpoCalendar`](#expocalendar) object that is the user's default calendar.
 * @platform ios
 */
export function getDefaultCalendarSync(): ExpoCalendar {
  if (Platform.OS === 'android' || !InternalExpoCalendar.getDefaultCalendarSync) {
    throw new UnavailabilityError('Calendar', 'getDefaultCalendar');
  }
  const defaultCalendar = InternalExpoCalendar.getDefaultCalendarSync();
  Object.setPrototypeOf(defaultCalendar, ExpoCalendar.prototype);
  return defaultCalendar as ExpoCalendar;
}

/**
 * Gets an array of [`ExpoCalendar`](#expocalendar) shared objects with details about the different calendars stored on the device.
 * @param entityType __iOS Only.__ Not required, but if defined, filters the returned calendars to
 * a specific [entity type](#entitytypes). Possible values are `Calendar.EntityTypes.EVENT` (for calendars shown in
 * the Calendar app) and `Calendar.EntityTypes.REMINDER` (for the Reminders app).
 * > **Note:** If not defined, you will need both permissions: **CALENDAR** and **REMINDERS**.
 * @return An array of [`ExpoCalendar`](#expocalendar) shared objects matching the provided entity type (if provided).
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
export const requestCalendarPermissions = InternalExpoCalendar.requestCalendarPermissions;

/**
 * Checks user's permissions for accessing user's calendars.
 * @param writeOnly - On iOS, whether to check write-only access, which allows creating calendar events
 * without reading existing calendars or events. This does not grant permission to create, update, or delete calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export const getCalendarPermissions = InternalExpoCalendar.getCalendarPermissions;

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
 * > `getCalendars()` and inspect each calendar's `source` field.
 * @returns An array of Source objects representing the sources found.
 * @platform ios
 */
export function getSourcesSync(): Source[] {
  if (Platform.OS !== 'ios') {
    throw new UnavailabilityError('Calendar', 'getSourcesSync');
  }
  return InternalExpoCalendar.getSourcesSync();
}

export type {
  ModifiableEventProperties,
  ModifiableReminderProperties,
  ModifiableCalendarProperties,
  AddEventWithFormOptions,
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
} from './legacy/Calendar';
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
} from './legacy/Calendar';

/**
 * Check or request permissions to access the user's calendars.
 * This uses both `getCalendarPermissions` and `requestCalendarPermissions` to interact
 * with the permissions.
 * On iOS, `writeOnly` requests permission to create calendar events without reading
 * existing calendars or events. It does not grant permission to create, update, or delete calendars.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Calendar.useCalendarPermissions();
 * ```
 */
export const useCalendarPermissions = createPermissionHook<
  PermissionResponse,
  { writeOnly?: boolean }
>({
  getMethod: (options) => getCalendarPermissions(options?.writeOnly),
  requestMethod: (options) => requestCalendarPermissions(options?.writeOnly),
});

/**
 * Check or request permissions to access the user's reminders.
 * This uses both `getRemindersPermissions` and `requestRemindersPermissions` to interact
 * with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Calendar.useRemindersPermissions();
 * ```
 * @platform ios
 */
export function useRemindersPermissions(
  options?: PermissionHookOptions<object>
): ReturnType<typeof createRemindersPermissionHook> {
  if (Platform.OS !== 'ios') {
    // While for getRemindersPermissions and other iOS-specific functions we throw UnavailabilityError,
    // returning a denied permission response is a deliberate choice to make it work without need to wrap it in try/catch.
    const response: PermissionResponse = {
      canAskAgain: false,
      expires: 'never',
      granted: false,
      status: PermissionStatus.DENIED,
    };
    return [response, async () => response, async () => response];
  }
  return createRemindersPermissionHook(options);
}

const createRemindersPermissionHook = createPermissionHook({
  getMethod: getRemindersPermissions,
  requestMethod: requestRemindersPermissions,
});

export * from './legacyWarnings';
