import {
  createPermissionHook,
  PermissionStatus,
  UnavailabilityError,
  type PermissionHookOptions,
} from 'expo';
import { Platform, processColor } from 'react-native';

import * as CalendarNamespace from './CalendarNamespace';
import InternalExpoCalendar from './ExpoCalendar';
import type {
  ExtendedProperty,
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

  override async getExtendedProperties(): Promise<ExtendedProperty[]> {
    if (Platform.OS !== 'android') {
      throw new UnavailabilityError('ExpoCalendarEvent', 'getExtendedProperties');
    }
    return await super.getExtendedProperties();
  }

  override async setExtendedProperty(name: string, value: string): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new UnavailabilityError('ExpoCalendarEvent', 'setExtendedProperty');
    }
    await super.setExtendedProperty(name, value);
  }

  override async deleteExtendedProperty(name: string): Promise<boolean> {
    if (Platform.OS !== 'android') {
      throw new UnavailabilityError('ExpoCalendarEvent', 'deleteExtendedProperty');
    }
    return await super.deleteExtendedProperty(name);
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
 * @deprecated Use `Calendar.getDefaultCalendarSync()` instead.
 */
export function getDefaultCalendarSync(): ExpoCalendar {
  return CalendarNamespace.getDefaultCalendarSync();
}

/**
 * @deprecated Use `Calendar.getCalendars()` instead.
 */
export async function getCalendars(entityType?: EntityTypes): Promise<ExpoCalendar[]> {
  return CalendarNamespace.getCalendars(entityType);
}

/**
 * @deprecated Use `Calendar.createCalendar()` instead.
 */
export async function createCalendar(details: Partial<Calendar> = {}): Promise<ExpoCalendar> {
  return CalendarNamespace.createCalendar(details);
}

/**
 * @deprecated Use `Calendar.presentPicker()` instead.
 */
export async function presentPicker(): Promise<ExpoCalendar | null> {
  return CalendarNamespace.presentPicker();
}

/**
 * @deprecated Use `Calendar.listEvents()` instead.
 */
export async function listEvents(
  calendars: (string | ExpoCalendar)[],
  startDate: Date,
  endDate: Date
): Promise<ExpoCalendarEvent[]> {
  return CalendarNamespace.listEvents(calendars, startDate, endDate);
}

/**
 * @deprecated Use `Calendar.requestCalendarPermissions()` instead.
 */
export async function requestCalendarPermissions(writeOnly?: boolean): Promise<PermissionResponse> {
  return CalendarNamespace.requestCalendarPermissions(writeOnly);
}

/**
 * @deprecated Use `Calendar.getCalendarPermissions()` instead.
 */
export async function getCalendarPermissions(writeOnly?: boolean): Promise<PermissionResponse> {
  return CalendarNamespace.getCalendarPermissions(writeOnly);
}

/**
 * @deprecated Use `Calendar.requestRemindersPermissions()` instead.
 */
export async function requestRemindersPermissions(): Promise<PermissionResponse> {
  return CalendarNamespace.requestRemindersPermissions();
}

/**
 * @deprecated Use `Calendar.getRemindersPermissions()` instead.
 */
export async function getRemindersPermissions(): Promise<PermissionResponse> {
  return CalendarNamespace.getRemindersPermissions();
}

/**
 * @deprecated Use `Calendar.getSourcesSync()` instead.
 */
export function getSourcesSync(): Source[] {
  return CalendarNamespace.getSourcesSync();
}

export type {
  ExtendedProperty,
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
    // returning a denied permission response is a deliberate choice to make it work without needing to wrap it in try/catch.
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
