import { UnavailabilityError } from 'expo';
import { Platform, processColor } from 'react-native';

import InternalExpoCalendar from './ExpoCalendar';
import type {
  ExtendedProperty,
  ModifiableEventProperties,
  ModifiableReminderProperties,
  ModifiableCalendarProperties,
  ModifiableAttendeeProperties,
  AddEventWithFormOptions,
  CalendarDetails,
} from './ExpoCalendar.types';
import type {
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
export class CalendarAttendee extends InternalExpoCalendar.ExpoCalendarAttendee {
  override async update(details: Partial<ModifiableAttendeeProperties>): Promise<void> {
    if (!super.update) {
      throw new UnavailabilityError('CalendarAttendee', 'update');
    }
    const nullableDetailsFields = getNullableDetailsFields(details);
    return super.update(stringifyDateValues(details), nullableDetailsFields);
  }

  override async delete(): Promise<void> {
    if (!super.delete) {
      throw new UnavailabilityError('CalendarAttendee', 'delete');
    }
    await super.delete();
  }
}

/**
 * Represents a calendar event object that can be accessed and modified using the Expo Calendar Next API.
 */
export class CalendarEvent extends InternalExpoCalendar.ExpoCalendarEvent {
  override getOccurrenceSync(recurringEventOptions: RecurringEventOptions = {}): CalendarEvent {
    const result = super.getOccurrenceSync(stringifyDateValues(recurringEventOptions));
    Object.setPrototypeOf(result, CalendarEvent.prototype);
    return result;
  }

  override async getAttendees(): Promise<CalendarAttendee[]> {
    const attendees = await super.getAttendees();
    return attendees.map((attendee) => {
      Object.setPrototypeOf(attendee, CalendarAttendee.prototype);
      return attendee;
    });
  }

  override async createAttendee(attendee: Attendee): Promise<CalendarAttendee> {
    if (!super.createAttendee) {
      throw new UnavailabilityError('CalendarEvent', 'createAttendee');
    }
    const newAttendee = await super.createAttendee(attendee);
    Object.setPrototypeOf(newAttendee, CalendarAttendee.prototype);
    return newAttendee;
  }

  override async getExtendedProperties(): Promise<ExtendedProperty[]> {
    if (Platform.OS !== 'android') {
      throw new UnavailabilityError('CalendarEvent', 'getExtendedProperties');
    }
    return await super.getExtendedProperties();
  }

  override async setExtendedProperty(name: string, value: string): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new UnavailabilityError('CalendarEvent', 'setExtendedProperty');
    }
    await super.setExtendedProperty(name, value);
  }

  override async deleteExtendedProperty(name: string): Promise<boolean> {
    if (Platform.OS !== 'android') {
      throw new UnavailabilityError('CalendarEvent', 'deleteExtendedProperty');
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

  static override async get(eventId: string): Promise<CalendarEvent> {
    const event = await InternalExpoCalendar.getEventById(eventId);
    Object.setPrototypeOf(event, CalendarEvent.prototype);
    return event;
  }

  /**
   * Lists events from the device's calendar. It can be used to search events in multiple calendars.
   * > **Note:** If you want to search events in a single calendar, you can use [`calendar.listEvents`](#listeventsstartdate-enddate) instead.
   * @param calendars An array of calendar IDs (`string[]`) or [`Calendar`](#calendar) objects to search for events.
   * @param startDate The start date of the time range to search for events.
   * @param endDate The end date of the time range to search for events.
   * @returns An array of [`CalendarEvent`](#calendarevent) objects representing the events found.
   */
  static async list(
    calendars: (string | Calendar)[],
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    if (!InternalExpoCalendar.listEvents) {
      throw new UnavailabilityError('CalendarEvent', 'list');
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
}

/**
 * Represents a calendar reminder object that can be accessed and modified using the Expo Calendar Next API.
 * @platform ios
 */
export class CalendarReminder extends InternalExpoCalendar.ExpoCalendarReminder {
  override async update(details: Partial<ModifiableReminderProperties>): Promise<void> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('CalendarReminder', 'update');
    }
    const nullableDetailsFields = getNullableDetailsFields(details);
    await super.update(stringifyDateValues(details), nullableDetailsFields);
  }

  override async delete(): Promise<void> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('CalendarReminder', 'delete');
    }
    await super.delete();
  }

  static override async get(reminderId: string): Promise<CalendarReminder> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('CalendarReminder', 'get');
    }
    const reminder = await InternalExpoCalendar.getReminderById(reminderId);
    Object.setPrototypeOf(reminder, CalendarReminder.prototype);
    return reminder;
  }
}

/**
 * Represents a calendar object that can be accessed and modified using the Expo Calendar Next API.
 *
 * This class provides properties and methods for interacting with a specific calendar on the device,
 * such as retrieving its events, updating its details, and accessing its metadata.
 */
export class Calendar extends InternalExpoCalendar.ExpoCalendar {
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
  ): Promise<CalendarEvent> {
    const newEvent = await super.createEvent(stringifyDateValues(details));
    Object.setPrototypeOf(newEvent, CalendarEvent.prototype);
    return newEvent;
  }

  override async createReminder(details: Partial<Reminder>): Promise<CalendarReminder> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('Calendar', 'createReminder');
    }
    const newReminder = await super.createReminder(stringifyDateValues(details));
    Object.setPrototypeOf(newReminder, CalendarReminder.prototype);
    return newReminder;
  }

  override async listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    if (!startDate) {
      throw new Error('listEvents must be called with a startDate (date) to search for events');
    }
    if (!endDate) {
      throw new Error('listEvents must be called with an endDate (date) to search for events');
    }
    const events = await super.listEvents(stringifyIfDate(startDate), stringifyIfDate(endDate));
    return events.map((event) => {
      Object.setPrototypeOf(event, CalendarEvent.prototype);
      return event;
    });
  }

  override async listReminders(
    startDate: Date | null = null,
    endDate: Date | null = null,
    status: ReminderStatus | null = null
  ): Promise<CalendarReminder[]> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('Calendar', 'listReminders');
    }
    const reminders = await super.listReminders(
      startDate ? stringifyIfDate(startDate) : null,
      endDate ? stringifyIfDate(endDate) : null,
      status
    );
    return reminders.map((reminder) => {
      Object.setPrototypeOf(reminder, CalendarReminder.prototype);
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
      throw new UnavailabilityError('Calendar', 'addEventWithForm');
    }
    return super.addEventWithForm(options && stringifyDateValues(options));
  }

  static override async get(calendarId: string): Promise<Calendar> {
    const calendar = await InternalExpoCalendar.getCalendarById(calendarId);
    Object.setPrototypeOf(calendar, Calendar.prototype);
    return calendar;
  }

  /**
   * Gets an array of [`Calendar`](#calendar) shared objects with details about the
   * calendars available to the app.
   *
   * > **iOS 17+:** With write-only calendar access, requesting `EntityTypes.EVENT` returns a
   * > single virtual calendar, which can be used to create events but does not expose the user's
   * > real calendars.
   *
   * @param entityType __iOS Only.__ Not required, but if defined, filters the returned calendars to a specific [entity type](#entitytypes).
   * > **Note:** If not defined, both calendar (write-only is enough) and reminders permissions are required.
   * @return An array of [`Calendar`](#calendar) shared objects matching the provided entity type, if provided.
   */
  static async getAll(entityType?: EntityTypes): Promise<Calendar[]> {
    if (!InternalExpoCalendar.getCalendars) {
      throw new UnavailabilityError('Calendar', 'getAll');
    }
    const calendars = await InternalExpoCalendar.getCalendars(entityType);
    return calendars.map((calendar) => {
      Object.setPrototypeOf(calendar, Calendar.prototype);
      return calendar;
    });
  }

  /**
   * Creates a new calendar on the device, allowing events to be added later and displayed in the OS Calendar app.
   * @param details A map of details for the calendar to be created.
   * @returns A [`Calendar`](#calendar) object representing the newly created calendar.
   */
  static async create(details: CalendarDetails = {}): Promise<Calendar> {
    const color = details.color ? processColor(details.color) : undefined;
    const newDetails = { ...details, id: undefined, color: color || undefined };
    const createdCalendar = await InternalExpoCalendar.createCalendar(newDetails);
    Object.setPrototypeOf(createdCalendar, Calendar.prototype);
    return createdCalendar;
  }

  /**
   * Gets an instance of the default calendar object.
   *
   * > **iOS 17+:** With write-only calendar access, this returns EventKit's virtual calendar,
   * > which can be used to create events but does not expose existing calendar data.
   *
   * > **Android:** This function is not available on Android. Android does not expose a single
   * > system-managed default calendar. Use `Calendar.getAll()` and choose an appropriate writable
   * > calendar for your app; `isPrimary` can help identify per-account primary calendars.
   * @return A [`Calendar`](#calendar) object that is the user's default calendar.
   * @platform ios
   */
  static getDefaultSync(): Calendar {
    if (Platform.OS === 'android' || !InternalExpoCalendar.getDefaultCalendarSync) {
      throw new UnavailabilityError('Calendar', 'getDefaultSync');
    }
    const defaultCalendar = InternalExpoCalendar.getDefaultCalendarSync();
    return Object.setPrototypeOf(defaultCalendar, Calendar.prototype);
  }

  /**
   * Presents the OS calendar picker and returns the selected calendar.
   * @return A [`Calendar`](#calendar) object or `null` when the picker is cancelled.
   * @platform ios
   */
  static async presentPicker(): Promise<Calendar | null> {
    if (!InternalExpoCalendar.presentPicker) {
      throw new UnavailabilityError('Calendar', 'presentPicker');
    }
    const calendar = await InternalExpoCalendar.presentPicker();
    if (calendar) {
      Object.setPrototypeOf(calendar, Calendar.prototype);
    }
    return calendar;
  }

  /**
   * Asks the user to grant permissions for accessing user's calendars.
   * @param writeOnly - On iOS, whether to request write-only access, which allows creating calendar events
   * without reading existing calendars or events. This does not grant permission to create, update, or delete calendars.
   * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
   */
  static async requestPermissions(writeOnly?: boolean): Promise<PermissionResponse> {
    return InternalExpoCalendar.requestCalendarPermissions(writeOnly);
  }

  /**
   * Checks user's permissions for accessing user's calendars.
   * @param writeOnly - On iOS, whether to check write-only access, which allows creating calendar events
   * without reading existing calendars or events. This does not grant permission to create, update, or delete calendars.
   * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
   */
  static async getPermissions(writeOnly?: boolean): Promise<PermissionResponse> {
    return InternalExpoCalendar.getCalendarPermissions(writeOnly);
  }

  /**
   * Asks the user to grant permissions for accessing user's reminders.
   * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
   * @platform ios
   */
  static async requestRemindersPermissions(): Promise<PermissionResponse> {
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
  static async getRemindersPermissions(): Promise<PermissionResponse> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('Calendar', 'getRemindersPermissions');
    }
    return InternalExpoCalendar.getRemindersPermissions!();
  }

  /**
   * Gets an array of Source objects with details about the different sources stored on the device.
   * > **Android:** This function is not available on Android. Android does not expose a
   * > first-class calendar sources API. If you need account-like source information, call
   * > `Calendar.getAll()` and inspect each calendar's `source` field.
   * @returns An array of Source objects representing the sources found.
   * @platform ios
   */
  static getSourcesSync(): Source[] {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('Calendar', 'getSourcesSync');
    }
    return InternalExpoCalendar.getSourcesSync();
  }
}

export type {
  ExtendedProperty,
  CalendarDetails,
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

export * from './legacyWarnings';
