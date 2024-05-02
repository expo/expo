import {
  PermissionResponse,
  PermissionStatus,
  PermissionHookOptions,
  createPermissionHook,
  UnavailabilityError,
} from 'expo-modules-core';
import { Platform, processColor } from 'react-native';

import ExpoCalendar from './ExpoCalendar';

// @needsAudit
/**
 * @platform ios
 */
export type RecurringEventOptions = {
  /**
   * Whether or not future events in the recurring series should also be updated. If `true`, will
   * apply the given changes to the recurring instance specified by `instanceStartDate` and all
   * future events in the series. If `false`, will only apply the given changes to the instance
   * specified by `instanceStartDate`.
   */
  futureEvents?: boolean;
  /**
   * Date object representing the start time of the desired instance, if looking for a single instance
   * of a recurring event. If this is not provided and **id** represents a recurring event, the first
   * instance of that event will be returned by default.
   */
  instanceStartDate?: string | Date;
};

// @needsAudit
/**
 * A calendar record upon which events (or, on iOS, reminders) can be stored. Settings here apply to
 * the calendar as a whole and how its events are displayed in the OS calendar app.
 */
export type Calendar = {
  /**
   * Internal ID that represents this calendar on the device.
   */
  id: string;
  /**
   * Visible name of the calendar.
   */
  title: string;
  /**
   * ID of the source to be used for the calendar. Likely the same as the source for any other
   * locally stored calendars.
   * @platform ios
   */
  sourceId?: string;
  /**
   * Object representing the source to be used for the calendar.
   */
  source: Source;
  /**
   * Type of calendar this object represents.
   * Possible values: [`CalendarType`](#calendarcalendartype).
   * @platform ios
   */
  type?: CalendarType;
  /**
   * Color used to display this calendar's events.
   */
  color: string;
  /**
   * Whether the calendar is used in the Calendar or Reminders OS app.
   * Possible values: [`EntityTypes`](#calendarentitytypes).
   * @platform ios
   */
  entityType?: EntityTypes;
  /**
   * Boolean value that determines whether this calendar can be modified.
   */
  allowsModifications: boolean;
  /**
   * Availability types that this calendar supports.
   * Possible values: Array of [`Availability`](#calendaravailability).
   */
  allowedAvailabilities: Availability[];
  /**
   * Boolean value indicating whether this is the device's primary calendar.
   * @platform android
   */
  isPrimary?: boolean;
  /**
   * Internal system name of the calendar.
   * @platform android
   */
  name?: string | null;
  /**
   * Name for the account that owns this calendar.
   * @platform android
   */
  ownerAccount?: string;
  /**
   * Time zone for the calendar.
   * @platform android
   */
  timeZone?: string;
  /**
   * Alarm methods that this calendar supports.
   * Possible values: Array of [`AlarmMethod`](#calendaralarmmethod).
   * @platform android
   */
  allowedReminders?: AlarmMethod[];
  /**
   * Attendee types that this calendar supports.
   * Possible values: Array of [`AttendeeType`](#calendarattendeetype).
   * @platform android
   */
  allowedAttendeeTypes?: AttendeeType[];
  /**
   * Indicates whether the OS displays events on this calendar.
   * @platform android
   */
  isVisible?: boolean;
  /**
   * Indicates whether this calendar is synced and its events stored on the device.
   * Unexpected behavior may occur if this is not set to `true`.
   * @platform android
   */
  isSynced?: boolean;
  /**
   * Level of access that the user has for the calendar.
   * Possible values: [`CalendarAccessLevel`](#calendarcalendaraccesslevel).
   * @platform android
   */
  accessLevel?: CalendarAccessLevel;
};

// @needsAudit
/**
 * A source account that owns a particular calendar. Expo apps will typically not need to interact with `Source` objects.
 */
export type Source = {
  /**
   * Internal ID that represents this source on the device.
   * @platform ios
   */
  id?: string;
  /**
   * Type of the account that owns this calendar and was used to sync it to the device.
   * If `isLocalAccount` is falsy then this must be defined, and must match an account on the device
   * along with `name`, or the OS will delete the calendar.
   * On iOS, one of [`SourceType`](#calendarsourcetype)s.
   */
  type: string | SourceType;
  /**
   * Name for the account that owns this calendar and was used to sync the calendar to the device.
   */
  name: string;
  /**
   * Whether this source is the local phone account. Must be `true` if `type` is `undefined`.
   * @platform android
   */
  isLocalAccount?: boolean;
};

// @needsAudit
/**
 * An event record, or a single instance of a recurring event. On iOS, used in the Calendar app.
 */
export type Event = {
  /**
   * Internal ID that represents this event on the device.
   */
  id: string;
  /**
   * ID of the calendar that contains this event.
   */
  calendarId: string;
  /**
   * Visible name of the event.
   */
  title: string;
  /**
   * Location field of the event.
   */
  location: string;
  /**
   * Date when the event record was created.
   * @platform ios
   */
  creationDate?: string | Date;
  /**
   * Date when the event record was last modified.
   * @platform ios
   */
  lastModifiedDate?: string | Date;
  /**
   * Time zone the event is scheduled in.
   */
  timeZone: string;
  /**
   * Time zone for the event end time.
   * @platform android
   */
  endTimeZone?: string;
  /**
   * URL for the event.
   * @platform ios
   */
  url?: string;
  /**
   * Description or notes saved with the event.
   */
  notes: string;
  /**
   * Array of Alarm objects which control automated reminders to the user.
   */
  alarms: Alarm[];
  /**
   * Object representing rules for recurring or repeating events. Set to `null` for one-time events.
   */
  recurrenceRule: RecurrenceRule;
  /**
   * Date object or string representing the time when the event starts.
   */
  startDate: string | Date;
  /**
   * Date object or string representing the time when the event ends.
   */
  endDate: string | Date;
  /**
   * For recurring events, the start date for the first (original) instance of the event.
   * @platform ios
   */
  originalStartDate?: string | Date;
  /**
   * Boolean value indicating whether or not the event is a detached (modified) instance of a recurring event.
   * @platform ios
   */
  isDetached?: boolean;
  /**
   * Whether the event is displayed as an all-day event on the calendar
   */
  allDay: boolean;
  /**
   * The availability setting for the event.
   * Possible values: [`Availability`](#calendaravailability).
   */
  availability: Availability;
  /**
   * Status of the event.
   * Possible values: [`EventStatus`](#calendareventstatus).
   */
  status: EventStatus;
  /**
   * Organizer of the event.
   * @platform ios
   */
  organizer?: string;
  /**
   * Email address of the organizer of the event.
   * @platform android
   */
  organizerEmail?: string;
  /**
   * User's access level for the event.
   * Possible values: [`EventAccessLevel`](#calendareventaccesslevel).
   * @platform android
   */
  accessLevel?: EventAccessLevel;
  /**
   * Whether invited guests can modify the details of the event.
   * @platform android
   */
  guestsCanModify?: boolean;
  /**
   * Whether invited guests can invite other guests.
   * @platform android
   */
  guestsCanInviteOthers?: boolean;
  /**
   * Whether invited guests can see other guests.
   * @platform android
   */
  guestsCanSeeGuests?: boolean;
  /**
   * For detached (modified) instances of recurring events, the ID of the original recurring event.
   * @platform android
   */
  originalId?: string;
  /**
   * For instances of recurring events, volatile ID representing this instance. Not guaranteed to
   * always refer to the same instance.
   * @platform android
   */
  instanceId?: string;
};

// @needsAudit
/**
 * A reminder record, used in the iOS Reminders app. No direct analog on Android.
 * @platform ios
 */
export type Reminder = {
  /**
   * Internal ID that represents this reminder on the device.
   */
  id?: string;
  /**
   * ID of the calendar that contains this reminder.
   */
  calendarId?: string;
  /**
   * Visible name of the reminder.
   */
  title?: string;
  /**
   * Location field of the reminder
   */
  location?: string;
  /**
   * Date when the reminder record was created.
   */
  creationDate?: string | Date;
  /**
   * Date when the reminder record was last modified.
   */
  lastModifiedDate?: string | Date;
  /**
   * Time zone the reminder is scheduled in.
   */
  timeZone?: string;
  /**
   * URL for the reminder.
   */
  url?: string;
  /**
   * Description or notes saved with the reminder.
   */
  notes?: string;
  /**
   * Array of Alarm objects which control automated alarms to the user about the task.
   */
  alarms?: Alarm[];
  /**
   * Object representing rules for recurring or repeated reminders. Null for one-time tasks.
   */
  recurrenceRule?: RecurrenceRule;
  /**
   * Date object or string representing the start date of the reminder task.
   */
  startDate?: string | Date;
  /**
   * Date object or string representing the time when the reminder task is due.
   */
  dueDate?: string | Date;
  /**
   * Indicates whether or not the task has been completed.
   */
  completed?: boolean;
  /**
   * Date object or string representing the date of completion, if `completed` is `true`.
   * Setting this property of a nonnull `Date` will automatically set the reminder's `completed` value to `true`.
   */
  completionDate?: string | Date;
};

// @needsAudit
/**
 * A person or entity that is associated with an event by being invited or fulfilling some other role.
 */
export type Attendee = {
  /**
   * Internal ID that represents this attendee on the device.
   * @platform android
   */
  id?: string;
  /**
   * Indicates whether or not this attendee is the current OS user.
   * @platform ios
   */
  isCurrentUser?: boolean;
  /**
   * Displayed name of the attendee.
   */
  name: string;
  /**
   * Role of the attendee at the event.
   * Possible values: [`AttendeeRole`](#calendarattendeerole).
   */
  role: AttendeeRole;
  /**
   * Status of the attendee in relation to the event.
   * Possible values: [`AttendeeStatus`](#calendarattendeestatus).
   */
  status: AttendeeStatus;
  /**
   * Type of the attendee.
   * Possible values: [`AttendeeType`](#calendarattendeetype).
   */
  type: AttendeeType;
  /**
   * URL for the attendee.
   * @platform ios
   */
  url?: string;
  /**
   * Email address of the attendee.
   * @platform android
   */
  email?: string;
};

// @needsAudit
/**
 * A method for having the OS automatically remind the user about an calendar item.
 */
export type Alarm = {
  /**
   * Date object or string representing an absolute time the alarm should occur.
   * Overrides `relativeOffset` and `structuredLocation` if specified alongside either.
   * @platform ios
   */
  absoluteDate?: string;
  /**
   * Number of minutes from the `startDate` of the calendar item that the alarm should occur.
   * Use negative values to have the alarm occur before the `startDate`.
   */
  relativeOffset?: number;
  // @docsMissing
  structuredLocation?: AlarmLocation;
  /**
   * Method of alerting the user that this alarm should use; on iOS this is always a notification.
   * Possible values: [`AlarmMethod`](#calendaralarmmethod).
   * @platform android
   */
  method?: AlarmMethod;
};

// @needsAudit @docsMissing
export type AlarmLocation = {
  /**
   * @platform ios
   */
  title?: string;
  proximity?: string;
  radius?: number;
  coords?: {
    latitude?: number;
    longitude?: number;
  };
};

export enum DayOfTheWeek {
  Sunday = 1,
  Monday = 2,
  Tuesday = 3,
  Wednesday = 4,
  Thursday = 5,
  Friday = 6,
  Saturday = 7,
}

export enum MonthOfTheYear {
  January = 1,
  February = 2,
  March = 3,
  April = 4,
  May = 5,
  June = 6,
  July = 7,
  August = 8,
  September = 9,
  October = 10,
  November = 11,
  December = 12,
}

// @needsAudit
/**
 * A recurrence rule for events or reminders, allowing the same calendar item to recur multiple times.
 * This type is based on [the iOS interface](https://developer.apple.com/documentation/eventkit/ekrecurrencerule/1507320-initrecurrencewithfrequency)
 * which is in turn based on [the iCal RFC](https://tools.ietf.org/html/rfc5545#section-3.8.5.3)
 * so you can refer to those to learn more about this potentially complex interface.
 *
 * Not all of the combinations make sense. For example, when frequency is `DAILY`, setting `daysOfTheMonth` makes no sense.
 */
export type RecurrenceRule = {
  /**
   * How often the calendar item should recur.
   * Possible values: [`Frequency`](#calendarfrequency).
   */
  frequency: Frequency;
  /**
   * Interval at which the calendar item should recur. For example, an `interval: 2` with `frequency: DAILY`
   * would yield an event that recurs every other day.
   * @default 1
   */
  interval?: number;
  /**
   * Date on which the calendar item should stop recurring; overrides `occurrence` if both are specified.
   */
  endDate?: string | Date;
  /**
   * Number of times the calendar item should recur before stopping.
   */
  occurrence?: number;
  /**
   * The days of the week the event should recur on. An array of [`DaysOfTheWeek`](#daysoftheweek) object.
   * @platform ios
   */
  daysOfTheWeek?: DaysOfTheWeek[];
  /**
   * The days of the month this event occurs on.
   * `-31` to `31` (not including `0`). Negative indicates a value from the end of the range.
   * This field is only valid for `Calendar.Frequency.Monthly`.
   * @platform ios
   */
  daysOfTheMonth?: number[];
  /**
   * The months this event occurs on.
   * This field is only valid for `Calendar.Frequency.Yearly`.
   * @platform ios
   */
  monthsOfTheYear?: MonthOfTheYear[];
  /**
   * The weeks of the year this event occurs on.
   * `-53` to `53` (not including `0`). Negative indicates a value from the end of the range.
   * This field is only valid for `Calendar.Frequency.Yearly`.
   * @platform ios
   */
  weeksOfTheYear?: number[];
  /**
   * The days of the year this event occurs on.
   * `-366` to `366` (not including `0`). Negative indicates a value from the end of the range.
   * This field is only valid for `Calendar.Frequency.Yearly`.
   * @platform ios
   */
  daysOfTheYear?: number[];
  /**
   * TAn array of numbers that filters which recurrences to include. For example, for an event that
   * recurs every Monday, passing 2 here will make it recur every other Monday.
   * `-366` to `366` (not including `0`). Negative indicates a value from the end of the range.
   * This field is only valid for `Calendar.Frequency.Yearly`.
   * @platform ios
   */
  setPositions?: number[];
};

// @needsAudit
/**
 * @platform ios
 */
export type DaysOfTheWeek = {
  /**
   * Sunday to Saturday - `DayOfTheWeek` enum.
   */
  dayOfTheWeek: DayOfTheWeek;
  /**
   * `-53` to `53` (`0` ignores this field, and a negative indicates a value from the end of the range).
   */
  weekNumber?: number;
};

export { PermissionResponse, PermissionStatus, PermissionHookOptions };

// @needsAudit
/**
 * Returns whether the Calendar API is enabled on the current device. This does not check the app permissions.
 *
 * @returns Async `boolean`, indicating whether the Calendar API is available on the current device.
 * Currently, this resolves `true` on iOS and Android only.
 */
export async function isAvailableAsync(): Promise<boolean> {
  return !!ExpoCalendar.getCalendarsAsync;
}

// @needsAudit
/**
 * Gets an array of calendar objects with details about the different calendars stored on the device.
 * @param entityType __iOS Only.__ Not required, but if defined, filters the returned calendars to
 * a specific entity type. Possible values are `Calendar.EntityTypes.EVENT` (for calendars shown in
 * the Calendar app) and `Calendar.EntityTypes.REMINDER` (for the Reminders app).
 * > **Note:** If not defined, you will need both permissions: **CALENDAR** and **REMINDERS**.
 * @return An array of [calendar objects](#calendar 'Calendar') matching the provided entity type (if provided).
 */
export async function getCalendarsAsync(entityType?: string): Promise<Calendar[]> {
  if (!ExpoCalendar.getCalendarsAsync) {
    throw new UnavailabilityError('Calendar', 'getCalendarsAsync');
  }
  if (!entityType) {
    return ExpoCalendar.getCalendarsAsync(null);
  }
  return ExpoCalendar.getCalendarsAsync(entityType);
}

// @needsAudit
/**
 * Creates a new calendar on the device, allowing events to be added later and displayed in the OS Calendar app.
 * @param details A map of details for the calendar to be created.
 * @return A string representing the ID of the newly created calendar.
 */
export async function createCalendarAsync(details: Partial<Calendar> = {}): Promise<string> {
  if (!ExpoCalendar.saveCalendarAsync) {
    throw new UnavailabilityError('Calendar', 'createCalendarAsync');
  }
  const color = details.color ? processColor(details.color) : undefined;
  const newDetails = { ...details, id: undefined, color };
  return ExpoCalendar.saveCalendarAsync(newDetails);
}

// @needsAudit
/**
 * Updates the provided details of an existing calendar stored on the device. To remove a property,
 * explicitly set it to `null` in `details`.
 * @param id ID of the calendar to update.
 * @param details A map of properties to be updated.
 */
export async function updateCalendarAsync(
  id: string,
  details: Partial<Calendar> = {}
): Promise<string> {
  if (!ExpoCalendar.saveCalendarAsync) {
    throw new UnavailabilityError('Calendar', 'updateCalendarAsync');
  }
  if (!id) {
    throw new Error(
      'updateCalendarAsync must be called with an id (string) of the target calendar'
    );
  }
  const color = details.color ? processColor(details.color) : undefined;

  if (Platform.OS === 'android') {
    if (
      details.hasOwnProperty('source') ||
      details.hasOwnProperty('color') ||
      details.hasOwnProperty('allowsModifications') ||
      details.hasOwnProperty('allowedAvailabilities') ||
      details.hasOwnProperty('isPrimary') ||
      details.hasOwnProperty('ownerAccount') ||
      details.hasOwnProperty('timeZone') ||
      details.hasOwnProperty('allowedReminders') ||
      details.hasOwnProperty('allowedAttendeeTypes') ||
      details.hasOwnProperty('accessLevel')
    ) {
      console.warn(
        'updateCalendarAsync was called with one or more read-only properties, which will not be updated'
      );
    }
  } else {
    if (
      details.hasOwnProperty('source') ||
      details.hasOwnProperty('type') ||
      details.hasOwnProperty('entityType') ||
      details.hasOwnProperty('allowsModifications') ||
      details.hasOwnProperty('allowedAvailabilities')
    ) {
      console.warn(
        'updateCalendarAsync was called with one or more read-only properties, which will not be updated'
      );
    }
  }

  const newDetails = { ...details, id, color };
  return ExpoCalendar.saveCalendarAsync(newDetails);
}

// @needsAudit
/**
 * Deletes an existing calendar and all associated events/reminders/attendees from the device. __Use with caution.__
 * @param id ID of the calendar to delete.
 */
export async function deleteCalendarAsync(id: string): Promise<void> {
  if (!ExpoCalendar.deleteCalendarAsync) {
    throw new UnavailabilityError('Calendar', 'deleteCalendarAsync');
  }
  if (!id) {
    throw new Error(
      'deleteCalendarAsync must be called with an id (string) of the target calendar'
    );
  }
  return ExpoCalendar.deleteCalendarAsync(id);
}

// @needsAudit
/**
 * Returns all events in a given set of calendars over a specified time period. The filtering has
 * slightly different behavior per-platform - on iOS, all events that overlap at all with the
 * `[startDate, endDate]` interval are returned, whereas on Android, only events that begin on or
 * after the `startDate` and end on or before the `endDate` will be returned.
 * @param calendarIds Array of IDs of calendars to search for events in.
 * @param startDate Beginning of time period to search for events in.
 * @param endDate End of time period to search for events in.
 * @return A promise which fulfils with an array of [`Event`](#event) objects matching the search criteria.
 */
export async function getEventsAsync(
  calendarIds: string[],
  startDate: Date,
  endDate: Date
): Promise<Event[]> {
  if (!ExpoCalendar.getEventsAsync) {
    throw new UnavailabilityError('Calendar', 'getEventsAsync');
  }
  if (!startDate) {
    throw new Error('getEventsAsync must be called with a startDate (date) to search for events');
  }
  if (!endDate) {
    throw new Error('getEventsAsync must be called with an endDate (date) to search for events');
  }
  if (!calendarIds || !calendarIds.length) {
    throw new Error(
      'getEventsAsync must be called with a non-empty array of calendarIds to search'
    );
  }
  return ExpoCalendar.getEventsAsync(
    stringifyIfDate(startDate),
    stringifyIfDate(endDate),
    calendarIds
  );
}

// @needsAudit
/**
 * Returns a specific event selected by ID. If a specific instance of a recurring event is desired,
 * the start date of this instance must also be provided, as instances of recurring events do not
 * have their own unique and stable IDs on either iOS or Android.
 * @param id ID of the event to return.
 * @param recurringEventOptions A map of options for recurring events.
 * @return A promise which fulfils with an [`Event`](#event) object matching the provided criteria, if one exists.
 */
export async function getEventAsync(
  id: string,
  recurringEventOptions: RecurringEventOptions = {}
): Promise<Event> {
  if (!ExpoCalendar.getEventByIdAsync) {
    throw new UnavailabilityError('Calendar', 'getEventAsync');
  }
  if (!id) {
    throw new Error('getEventAsync must be called with an id (string) of the target event');
  }
  if (Platform.OS === 'ios') {
    return ExpoCalendar.getEventByIdAsync(id, recurringEventOptions.instanceStartDate);
  } else {
    return ExpoCalendar.getEventByIdAsync(id);
  }
}

// @needsAudit
/**
 * Creates a new event on the specified calendar.
 * @param calendarId ID of the calendar to create this event in.
 * @param eventData A map of details for the event to be created.
 * @return A promise which fulfils with a string representing the ID of the newly created event.
 */
export async function createEventAsync(
  calendarId: string,
  eventData: Omit<Partial<Event>, 'id'> = {}
): Promise<string> {
  if (!ExpoCalendar.saveEventAsync) {
    throw new UnavailabilityError('Calendar', 'createEventAsync');
  }
  if (!calendarId) {
    throw new Error('createEventAsync must be called with an id (string) of the target calendar');
  }

  // @ts-expect-error id could be passed if user doesn't use TypeScript or doesn't use the method with an object litteral
  const { id, ...details } = eventData;

  if (id) {
    console.warn(
      'You attempted to create an event with an id. Event ids are assigned by the system.'
    );
  }

  if (Platform.OS === 'android') {
    if (!details.startDate) {
      throw new Error('createEventAsync requires a startDate (Date)');
    }
    if (!details.endDate) {
      throw new Error('createEventAsync requires an endDate (Date)');
    }
  }

  const newDetails = {
    ...details,
    calendarId,
  };

  return ExpoCalendar.saveEventAsync(stringifyDateValues(newDetails), {});
}

// @needsAudit
/**
 * Updates the provided details of an existing calendar stored on the device. To remove a property,
 * explicitly set it to `null` in `details`.
 * @param id ID of the event to be updated.
 * @param details A map of properties to be updated.
 * @param recurringEventOptions A map of options for recurring events.
 */
export async function updateEventAsync(
  id: string,
  details: Omit<Partial<Event>, 'id'> = {},
  recurringEventOptions: RecurringEventOptions = {}
): Promise<string> {
  if (!ExpoCalendar.saveEventAsync) {
    throw new UnavailabilityError('Calendar', 'updateEventAsync');
  }
  if (!id) {
    throw new Error('updateEventAsync must be called with an id (string) of the target event');
  }

  if (Platform.OS === 'ios') {
    if (
      details.hasOwnProperty('creationDate') ||
      details.hasOwnProperty('lastModifiedDate') ||
      details.hasOwnProperty('originalStartDate') ||
      details.hasOwnProperty('isDetached') ||
      details.hasOwnProperty('status') ||
      details.hasOwnProperty('organizer')
    ) {
      console.warn(
        'updateEventAsync was called with one or more read-only properties, which will not be updated'
      );
    }
  }

  const { futureEvents = false, instanceStartDate } = recurringEventOptions;
  const newDetails = { ...details, id, instanceStartDate };
  return ExpoCalendar.saveEventAsync(stringifyDateValues(newDetails), { futureEvents });
}

// @needsAudit
/**
 * Deletes an existing event from the device. Use with caution.
 * @param id ID of the event to be deleted.
 * @param recurringEventOptions A map of options for recurring events.
 */
export async function deleteEventAsync(
  id: string,
  recurringEventOptions: RecurringEventOptions = {}
): Promise<void> {
  if (!ExpoCalendar.deleteEventAsync) {
    throw new UnavailabilityError('Calendar', 'deleteEventAsync');
  }
  if (!id) {
    throw new Error('deleteEventAsync must be called with an id (string) of the target event');
  }
  const { futureEvents = false, instanceStartDate } = recurringEventOptions;
  return ExpoCalendar.deleteEventAsync({ id, instanceStartDate }, { futureEvents });
}

// @needsAudit
/**
 * Gets all attendees for a given event (or instance of a recurring event).
 * @param id ID of the event to return attendees for.
 * @param recurringEventOptions A map of options for recurring events.
 * @return A promise which fulfils with an array of [`Attendee`](#attendee) associated with the
 * specified event.
 */
export async function getAttendeesForEventAsync(
  id: string,
  recurringEventOptions: RecurringEventOptions = {}
): Promise<Attendee[]> {
  if (!ExpoCalendar.getAttendeesForEventAsync) {
    throw new UnavailabilityError('Calendar', 'getAttendeesForEventAsync');
  }
  if (!id) {
    throw new Error(
      'getAttendeesForEventAsync must be called with an id (string) of the target event'
    );
  }
  const { instanceStartDate } = recurringEventOptions;
  // Android only takes an ID, iOS takes an object
  const params = Platform.OS === 'ios' ? { id, instanceStartDate } : id;
  return ExpoCalendar.getAttendeesForEventAsync(params);
}

// @needsAudit
/**
 * Creates a new attendee record and adds it to the specified event. Note that if `eventId` specifies
 * a recurring event, this will add the attendee to every instance of the event.
 * @param eventId ID of the event to add this attendee to.
 * @param details A map of details for the attendee to be created.
 * @return A string representing the ID of the newly created attendee record.
 * @platform android
 */
export async function createAttendeeAsync(
  eventId: string,
  details: Partial<Attendee> = {}
): Promise<string> {
  if (!ExpoCalendar.saveAttendeeForEventAsync) {
    throw new UnavailabilityError('Calendar', 'createAttendeeAsync');
  }
  if (!eventId) {
    throw new Error('createAttendeeAsync must be called with an id (string) of the target event');
  }
  if (!details.email) {
    throw new Error('createAttendeeAsync requires an email (string)');
  }
  if (!details.role) {
    throw new Error('createAttendeeAsync requires a role (string)');
  }
  if (!details.type) {
    throw new Error('createAttendeeAsync requires a type (string)');
  }
  if (!details.status) {
    throw new Error('createAttendeeAsync requires a status (string)');
  }
  const newDetails = { ...details, id: undefined };
  return ExpoCalendar.saveAttendeeForEventAsync(newDetails, eventId);
}

// @needsAudit
/**
 * Updates an existing attendee record. To remove a property, explicitly set it to `null` in `details`.
 * @param id ID of the attendee record to be updated.
 * @param details A map of properties to be updated.
 * @platform android
 */
export async function updateAttendeeAsync(
  id: string,
  details: Partial<Attendee> = {}
): Promise<string> {
  if (!ExpoCalendar.saveAttendeeForEventAsync) {
    throw new UnavailabilityError('Calendar', 'updateAttendeeAsync');
  }
  if (!id) {
    throw new Error('updateAttendeeAsync must be called with an id (string) of the target event');
  }
  const newDetails = { ...details, id };
  return ExpoCalendar.saveAttendeeForEventAsync(newDetails, null);
}

// @needsAudit
/**
 * Gets an instance of the default calendar object.
 * @return A promise resolving to the [Calendar](#calendar) object that is the user's default calendar.
 * @platform ios
 */
export async function getDefaultCalendarAsync(): Promise<Calendar> {
  if (!ExpoCalendar.getDefaultCalendarAsync) {
    throw new UnavailabilityError('Calendar', 'getDefaultCalendarAsync');
  }
  return ExpoCalendar.getDefaultCalendarAsync();
}

// @needsAudit
/**
 * Deletes an existing attendee record from the device. __Use with caution.__
 * @param id ID of the attendee to delete.
 * @platform android
 */
export async function deleteAttendeeAsync(id: string): Promise<void> {
  if (!ExpoCalendar.deleteAttendeeAsync) {
    throw new UnavailabilityError('Calendar', 'deleteAttendeeAsync');
  }
  if (!id) {
    throw new Error('deleteAttendeeAsync must be called with an id (string) of the target event');
  }
  return ExpoCalendar.deleteAttendeeAsync(id);
}

// @needsAudit
/**
 * Returns a list of reminders matching the provided criteria. If `startDate` and `endDate` are defined,
 * returns all reminders that overlap at all with the [startDate, endDate] interval - i.e. all reminders
 * that end after the `startDate` or begin before the `endDate`.
 * @param calendarIds Array of IDs of calendars to search for reminders in.
 * @param status One of `Calendar.ReminderStatus.COMPLETED` or `Calendar.ReminderStatus.INCOMPLETE`.
 * @param startDate Beginning of time period to search for reminders in. Required if `status` is defined.
 * @param endDate End of time period to search for reminders in. Required if `status` is defined.
 * @return A promise which fulfils with an array of [`Reminder`](#reminder) objects matching the search criteria.
 * @platform ios
 */
export async function getRemindersAsync(
  calendarIds: (string | null)[],
  status: ReminderStatus | null,
  startDate: Date,
  endDate: Date
): Promise<Reminder[]> {
  if (!ExpoCalendar.getRemindersAsync) {
    throw new UnavailabilityError('Calendar', 'getRemindersAsync');
  }
  if (status && !startDate) {
    throw new Error(
      'getRemindersAsync must be called with a startDate (date) to search for reminders'
    );
  }
  if (status && !endDate) {
    throw new Error(
      'getRemindersAsync must be called with an endDate (date) to search for reminders'
    );
  }
  if (!calendarIds || !calendarIds.length) {
    throw new Error(
      'getRemindersAsync must be called with a non-empty array of calendarIds to search'
    );
  }
  return ExpoCalendar.getRemindersAsync(
    stringifyIfDate(startDate) || null,
    stringifyIfDate(endDate) || null,
    calendarIds,
    status || null
  );
}

// @needsAudit
/**
 * Returns a specific reminder selected by ID.
 * @param id ID of the reminder to return.
 * @return A promise which fulfils with a [`Reminder`](#reminder) matching the provided ID, if one exists.
 * @platform ios
 */
export async function getReminderAsync(id: string): Promise<Reminder> {
  if (!ExpoCalendar.getReminderByIdAsync) {
    throw new UnavailabilityError('Calendar', 'getReminderAsync');
  }
  if (!id) {
    throw new Error('getReminderAsync must be called with an id (string) of the target reminder');
  }
  return ExpoCalendar.getReminderByIdAsync(id);
}

// @needsAudit
/**
 * Creates a new reminder on the specified calendar.
 * @param calendarId ID of the calendar to create this reminder in (or `null` to add the calendar to
 * the OS-specified default calendar for reminders).
 * @param reminder A map of details for the reminder to be created
 * @return A promise which fulfils with a string representing the ID of the newly created reminder.
 * @platform ios
 */
export async function createReminderAsync(
  calendarId: string | null,
  reminder: Reminder = {}
): Promise<string> {
  if (!ExpoCalendar.saveReminderAsync) {
    throw new UnavailabilityError('Calendar', 'createReminderAsync');
  }

  const { id, ...details } = reminder;
  const newDetails = {
    ...details,
    calendarId: calendarId === null ? undefined : calendarId,
  };
  return ExpoCalendar.saveReminderAsync(stringifyDateValues(newDetails));
}

// @needsAudit
/**
 * Updates the provided details of an existing reminder stored on the device. To remove a property,
 * explicitly set it to `null` in `details`.
 * @param id ID of the reminder to be updated.
 * @param details A map of properties to be updated.
 * @platform ios
 */
export async function updateReminderAsync(id: string, details: Reminder = {}): Promise<string> {
  if (!ExpoCalendar.saveReminderAsync) {
    throw new UnavailabilityError('Calendar', 'updateReminderAsync');
  }
  if (!id) {
    throw new Error(
      'updateReminderAsync must be called with an id (string) of the target reminder'
    );
  }

  if (details.hasOwnProperty('creationDate') || details.hasOwnProperty('lastModifiedDate')) {
    console.warn(
      'updateReminderAsync was called with one or more read-only properties, which will not be updated'
    );
  }

  const newDetails = { ...details, id };
  return ExpoCalendar.saveReminderAsync(stringifyDateValues(newDetails));
}

// @needsAudit
/**
 * Deletes an existing reminder from the device. __Use with caution.__
 * @param id ID of the reminder to be deleted.
 * @platform ios
 */
export async function deleteReminderAsync(id: string): Promise<void> {
  if (!ExpoCalendar.deleteReminderAsync) {
    throw new UnavailabilityError('Calendar', 'deleteReminderAsync');
  }
  if (!id) {
    throw new Error(
      'deleteReminderAsync must be called with an id (string) of the target reminder'
    );
  }
  return ExpoCalendar.deleteReminderAsync(id);
}

// @needsAudit @docsMissing
/**
 * @return A promise which fulfils with an array of [`Source`](#source) objects all sources for
 * calendars stored on the device.
 * @platform ios
 */
export async function getSourcesAsync(): Promise<Source[]> {
  if (!ExpoCalendar.getSourcesAsync) {
    throw new UnavailabilityError('Calendar', 'getSourcesAsync');
  }
  return ExpoCalendar.getSourcesAsync();
}

// @needsAudit
/**
 * Returns a specific source selected by ID.
 * @param id ID of the source to return.
 * @return A promise which fulfils with an array of [`Source`](#source) object matching the provided
 * ID, if one exists.
 * @platform ios
 */
export async function getSourceAsync(id: string): Promise<Source> {
  if (!ExpoCalendar.getSourceByIdAsync) {
    throw new UnavailabilityError('Calendar', 'getSourceAsync');
  }
  if (!id) {
    throw new Error('getSourceAsync must be called with an id (string) of the target source');
  }
  return ExpoCalendar.getSourceByIdAsync(id);
}

// @needsAudit
/**
 * Sends an intent to open the specified event in the OS Calendar app.
 * @param id ID of the event to open.
 * @platform android
 */
export function openEventInCalendar(id: string): void {
  if (!ExpoCalendar.openEventInCalendar) {
    console.warn(`openEventInCalendar is not available on platform: ${Platform.OS}`);
    return;
  }
  if (!id) {
    throw new Error('openEventInCalendar must be called with an id (string) of the target event');
  }
  return ExpoCalendar.openEventInCalendar(parseInt(id, 10));
} // Android

// @needsAudit
/**
 * @deprecated Use [`requestCalendarPermissionsAsync()`](#calendarrequestcalendarpermissionsasync) instead.
 */
export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  console.warn(
    'requestPermissionsAsync is deprecated. Use requestCalendarPermissionsAsync instead.'
  );
  return requestCalendarPermissionsAsync();
}

// @needsAudit
/**
 * Checks user's permissions for accessing user's calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export async function getCalendarPermissionsAsync(): Promise<PermissionResponse> {
  if (!ExpoCalendar.getCalendarPermissionsAsync) {
    throw new UnavailabilityError('Calendar', 'getCalendarPermissionsAsync');
  }
  return ExpoCalendar.getCalendarPermissionsAsync();
}

// @needsAudit
/**
 * Checks user's permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export async function getRemindersPermissionsAsync(): Promise<PermissionResponse> {
  if (!ExpoCalendar.getRemindersPermissionsAsync) {
    throw new UnavailabilityError('Calendar', 'getRemindersPermissionsAsync');
  }
  return ExpoCalendar.getRemindersPermissionsAsync();
}

// @needsAudit
/**
 * Asks the user to grant permissions for accessing user's calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export async function requestCalendarPermissionsAsync(): Promise<PermissionResponse> {
  if (!ExpoCalendar.requestCalendarPermissionsAsync) {
    throw new UnavailabilityError('Calendar', 'requestCalendarPermissionsAsync');
  }
  return await ExpoCalendar.requestCalendarPermissionsAsync();
}

// @needsAudit
/**
 * Asks the user to grant permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export async function requestRemindersPermissionsAsync(): Promise<PermissionResponse> {
  if (!ExpoCalendar.requestRemindersPermissionsAsync) {
    throw new UnavailabilityError('Calendar', 'requestRemindersPermissionsAsync');
  }
  return await ExpoCalendar.requestRemindersPermissionsAsync();
}

// @needsAudit
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
export const useCalendarPermissions = createPermissionHook({
  getMethod: getCalendarPermissionsAsync,
  requestMethod: requestCalendarPermissionsAsync,
});

// @needsAudit
/**
 * Check or request permissions to access reminders.
 * This uses both `getRemindersPermissionsAsync` and `requestRemindersPermissionsAsync` to interact
 * with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Calendar.useRemindersPermissions();
 * ```
 */
export const useRemindersPermissions = createPermissionHook({
  getMethod: getRemindersPermissionsAsync,
  requestMethod: requestRemindersPermissionsAsync,
});

export enum EntityTypes {
  EVENT = 'event',
  REMINDER = 'reminder',
}

export enum Frequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum Availability {
  NOT_SUPPORTED = 'notSupported', // iOS
  BUSY = 'busy',
  FREE = 'free',
  TENTATIVE = 'tentative',
  UNAVAILABLE = 'unavailable', // iOS
}

export enum CalendarType {
  LOCAL = 'local',
  CALDAV = 'caldav',
  EXCHANGE = 'exchange',
  SUBSCRIBED = 'subscribed',
  BIRTHDAYS = 'birthdays',
  UNKNOWN = 'unknown',
} // iOS

export enum EventStatus {
  NONE = 'none',
  CONFIRMED = 'confirmed',
  TENTATIVE = 'tentative',
  CANCELED = 'canceled',
}

export enum SourceType {
  LOCAL = 'local',
  EXCHANGE = 'exchange',
  CALDAV = 'caldav',
  MOBILEME = 'mobileme',
  SUBSCRIBED = 'subscribed',
  BIRTHDAYS = 'birthdays',
}

export enum AttendeeRole {
  UNKNOWN = 'unknown', // iOS
  REQUIRED = 'required', // iOS
  OPTIONAL = 'optional', // iOS
  CHAIR = 'chair', // iOS
  NON_PARTICIPANT = 'nonParticipant', // iOS
  ATTENDEE = 'attendee', // Android
  ORGANIZER = 'organizer', // Android
  PERFORMER = 'performer', // Android
  SPEAKER = 'speaker', // Android
  NONE = 'none', // Android
}

export enum AttendeeStatus {
  UNKNOWN = 'unknown', // iOS
  PENDING = 'pending', // iOS
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative',
  DELEGATED = 'delegated', // iOS
  COMPLETED = 'completed', // iOS
  IN_PROCESS = 'inProcess', // iOS
  INVITED = 'invited', // Android
  NONE = 'none', // Android
}

export enum AttendeeType {
  UNKNOWN = 'unknown', // iOS
  PERSON = 'person', // iOS
  ROOM = 'room', // iOS
  GROUP = 'group', // iOS
  RESOURCE = 'resource',
  OPTIONAL = 'optional', // Android
  REQUIRED = 'required', // Android
  NONE = 'none', // Android
}

export enum AlarmMethod {
  ALARM = 'alarm',
  ALERT = 'alert',
  EMAIL = 'email',
  SMS = 'sms',
  DEFAULT = 'default',
}

export enum EventAccessLevel {
  CONFIDENTIAL = 'confidential',
  PRIVATE = 'private',
  PUBLIC = 'public',
  DEFAULT = 'default',
}

export enum CalendarAccessLevel {
  CONTRIBUTOR = 'contributor',
  EDITOR = 'editor',
  FREEBUSY = 'freebusy',
  OVERRIDE = 'override',
  OWNER = 'owner',
  READ = 'read',
  RESPOND = 'respond',
  ROOT = 'root',
  NONE = 'none',
}

export enum ReminderStatus {
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete',
}

function stringifyIfDate(date: any): any {
  return date instanceof Date ? date.toISOString() : date;
}

function stringifyDateValues(obj: object): object {
  if (typeof obj !== 'object' || obj === null) return obj;
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (value != null && typeof value === 'object' && !(value instanceof Date)) {
      if (Array.isArray(value)) {
        return { ...acc, [key]: value.map(stringifyDateValues) };
      }
      return { ...acc, [key]: stringifyDateValues(value) };
    }
    acc[key] = stringifyIfDate(value);
    return acc;
  }, {});
}
