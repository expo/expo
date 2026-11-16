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

  /**
   * Lists events from the device's calendar. It can be used to search events in multiple calendars.
   * > **Note:** If you want to search events in a single calendar, you can use [`ExpoCalendar.listEvents`](#listeventsstartdate-enddate) instead.
   * @param calendars An array of calendar IDs (`string[]`) or [`ExpoCalendar`](#expocalendar) objects to search for events.
   * @param startDate The start date of the time range to search for events.
   * @param endDate The end date of the time range to search for events.
   * @returns An array of [`ExpoCalendarEvent`](#expocalendarevent) objects representing the events found.
   */
  static async list(
    calendars: (string | ExpoCalendar)[],
    startDate: Date,
    endDate: Date
  ): Promise<ExpoCalendarEvent[]> {
    if (!InternalExpoCalendar.listEvents) {
      throw new UnavailabilityError('ExpoCalendarEvent', 'list');
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
  static async getAll(entityType?: EntityTypes): Promise<ExpoCalendar[]> {
    if (!InternalExpoCalendar.getCalendars) {
      throw new UnavailabilityError('ExpoCalendar', 'getAll');
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
  static async create(details: Partial<Calendar> = {}): Promise<ExpoCalendar> {
    const color = details.color ? processColor(details.color) : undefined;
    const newDetails = { ...details, id: undefined, color: color || undefined };
    const createdCalendar = await InternalExpoCalendar.createCalendar(newDetails);
    Object.setPrototypeOf(createdCalendar, ExpoCalendar.prototype);
    return createdCalendar;
  }

  /**
   * Gets an instance of the default calendar object.
   *
   * > **iOS 17+:** With write-only calendar access, this returns EventKit's virtual calendar,
   * > which can be used to create events but does not expose existing calendar data.
   *
   * > **Android:** This function is not available on Android. Android does not expose a single
   * > system-managed default calendar. Use `ExpoCalendar.getAll()` and choose an appropriate writable
   * > calendar for your app; `isPrimary` can help identify per-account primary calendars.
   * @return An [`ExpoCalendar`](#expocalendar) object that is the user's default calendar.
   * @platform ios
   */
  static getDefaultSync(): ExpoCalendar {
    if (Platform.OS === 'android' || !InternalExpoCalendar.getDefaultCalendarSync) {
      throw new UnavailabilityError('ExpoCalendar', 'getDefaultSync');
    }
    const defaultCalendar = InternalExpoCalendar.getDefaultCalendarSync();
    return Object.setPrototypeOf(defaultCalendar, ExpoCalendar.prototype);
  }

  /**
   * Presents the OS calendar picker and returns the selected calendar.
   * @return An [`ExpoCalendar`](#expocalendar) object or `null` when the picker is cancelled.
   * @platform ios
   */
  static async presentPicker(): Promise<ExpoCalendar | null> {
    if (!InternalExpoCalendar.presentPicker) {
      throw new UnavailabilityError('ExpoCalendar', 'presentPicker');
    }
    const calendar = await InternalExpoCalendar.presentPicker();
    if (calendar) {
      Object.setPrototypeOf(calendar, ExpoCalendar.prototype);
    }
    return calendar;
  }
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

export * from './legacyWarnings';
