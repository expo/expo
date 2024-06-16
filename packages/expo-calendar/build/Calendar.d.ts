import { PermissionResponse, PermissionStatus, PermissionHookOptions } from 'expo-modules-core';
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
    structuredLocation?: AlarmLocation;
    /**
     * Method of alerting the user that this alarm should use; on iOS this is always a notification.
     * Possible values: [`AlarmMethod`](#calendaralarmmethod).
     * @platform android
     */
    method?: AlarmMethod;
};
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
export declare enum DayOfTheWeek {
    Sunday = 1,
    Monday = 2,
    Tuesday = 3,
    Wednesday = 4,
    Thursday = 5,
    Friday = 6,
    Saturday = 7
}
export declare enum MonthOfTheYear {
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
    December = 12
}
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
/**
 * Returns whether the Calendar API is enabled on the current device. This does not check the app permissions.
 *
 * @returns Async `boolean`, indicating whether the Calendar API is available on the current device.
 * Currently, this resolves `true` on iOS and Android only.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Gets an array of calendar objects with details about the different calendars stored on the device.
 * @param entityType __iOS Only.__ Not required, but if defined, filters the returned calendars to
 * a specific entity type. Possible values are `Calendar.EntityTypes.EVENT` (for calendars shown in
 * the Calendar app) and `Calendar.EntityTypes.REMINDER` (for the Reminders app).
 * > **Note:** If not defined, you will need both permissions: **CALENDAR** and **REMINDERS**.
 * @return An array of [calendar objects](#calendar 'Calendar') matching the provided entity type (if provided).
 */
export declare function getCalendarsAsync(entityType?: string): Promise<Calendar[]>;
/**
 * Creates a new calendar on the device, allowing events to be added later and displayed in the OS Calendar app.
 * @param details A map of details for the calendar to be created.
 * @return A string representing the ID of the newly created calendar.
 */
export declare function createCalendarAsync(details?: Partial<Calendar>): Promise<string>;
/**
 * Updates the provided details of an existing calendar stored on the device. To remove a property,
 * explicitly set it to `null` in `details`.
 * @param id ID of the calendar to update.
 * @param details A map of properties to be updated.
 */
export declare function updateCalendarAsync(id: string, details?: Partial<Calendar>): Promise<string>;
/**
 * Deletes an existing calendar and all associated events/reminders/attendees from the device. __Use with caution.__
 * @param id ID of the calendar to delete.
 */
export declare function deleteCalendarAsync(id: string): Promise<void>;
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
export declare function getEventsAsync(calendarIds: string[], startDate: Date, endDate: Date): Promise<Event[]>;
/**
 * Returns a specific event selected by ID. If a specific instance of a recurring event is desired,
 * the start date of this instance must also be provided, as instances of recurring events do not
 * have their own unique and stable IDs on either iOS or Android.
 * @param id ID of the event to return.
 * @param recurringEventOptions A map of options for recurring events.
 * @return A promise which fulfils with an [`Event`](#event) object matching the provided criteria, if one exists.
 */
export declare function getEventAsync(id: string, recurringEventOptions?: RecurringEventOptions): Promise<Event>;
/**
 * Creates a new event on the specified calendar.
 * @param calendarId ID of the calendar to create this event in.
 * @param eventData A map of details for the event to be created.
 * @return A promise which fulfils with a string representing the ID of the newly created event.
 */
export declare function createEventAsync(calendarId: string, eventData?: Omit<Partial<Event>, 'id'>): Promise<string>;
/**
 * Updates the provided details of an existing calendar stored on the device. To remove a property,
 * explicitly set it to `null` in `details`.
 * @param id ID of the event to be updated.
 * @param details A map of properties to be updated.
 * @param recurringEventOptions A map of options for recurring events.
 */
export declare function updateEventAsync(id: string, details?: Omit<Partial<Event>, 'id'>, recurringEventOptions?: RecurringEventOptions): Promise<string>;
/**
 * Deletes an existing event from the device. Use with caution.
 * @param id ID of the event to be deleted.
 * @param recurringEventOptions A map of options for recurring events.
 */
export declare function deleteEventAsync(id: string, recurringEventOptions?: RecurringEventOptions): Promise<void>;
/**
 * Gets all attendees for a given event (or instance of a recurring event).
 * @param id ID of the event to return attendees for.
 * @param recurringEventOptions A map of options for recurring events.
 * @return A promise which fulfils with an array of [`Attendee`](#attendee) associated with the
 * specified event.
 */
export declare function getAttendeesForEventAsync(id: string, recurringEventOptions?: RecurringEventOptions): Promise<Attendee[]>;
/**
 * Creates a new attendee record and adds it to the specified event. Note that if `eventId` specifies
 * a recurring event, this will add the attendee to every instance of the event.
 * @param eventId ID of the event to add this attendee to.
 * @param details A map of details for the attendee to be created.
 * @return A string representing the ID of the newly created attendee record.
 * @platform android
 */
export declare function createAttendeeAsync(eventId: string, details?: Partial<Attendee>): Promise<string>;
/**
 * Updates an existing attendee record. To remove a property, explicitly set it to `null` in `details`.
 * @param id ID of the attendee record to be updated.
 * @param details A map of properties to be updated.
 * @platform android
 */
export declare function updateAttendeeAsync(id: string, details?: Partial<Attendee>): Promise<string>;
/**
 * Gets an instance of the default calendar object.
 * @return A promise resolving to the [Calendar](#calendar) object that is the user's default calendar.
 * @platform ios
 */
export declare function getDefaultCalendarAsync(): Promise<Calendar>;
/**
 * Deletes an existing attendee record from the device. __Use with caution.__
 * @param id ID of the attendee to delete.
 * @platform android
 */
export declare function deleteAttendeeAsync(id: string): Promise<void>;
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
export declare function getRemindersAsync(calendarIds: (string | null)[], status: ReminderStatus | null, startDate: Date, endDate: Date): Promise<Reminder[]>;
/**
 * Returns a specific reminder selected by ID.
 * @param id ID of the reminder to return.
 * @return A promise which fulfils with a [`Reminder`](#reminder) matching the provided ID, if one exists.
 * @platform ios
 */
export declare function getReminderAsync(id: string): Promise<Reminder>;
/**
 * Creates a new reminder on the specified calendar.
 * @param calendarId ID of the calendar to create this reminder in (or `null` to add the calendar to
 * the OS-specified default calendar for reminders).
 * @param reminder A map of details for the reminder to be created
 * @return A promise which fulfils with a string representing the ID of the newly created reminder.
 * @platform ios
 */
export declare function createReminderAsync(calendarId: string | null, reminder?: Reminder): Promise<string>;
/**
 * Updates the provided details of an existing reminder stored on the device. To remove a property,
 * explicitly set it to `null` in `details`.
 * @param id ID of the reminder to be updated.
 * @param details A map of properties to be updated.
 * @platform ios
 */
export declare function updateReminderAsync(id: string, details?: Reminder): Promise<string>;
/**
 * Deletes an existing reminder from the device. __Use with caution.__
 * @param id ID of the reminder to be deleted.
 * @platform ios
 */
export declare function deleteReminderAsync(id: string): Promise<void>;
/**
 * @return A promise which fulfils with an array of [`Source`](#source) objects all sources for
 * calendars stored on the device.
 * @platform ios
 */
export declare function getSourcesAsync(): Promise<Source[]>;
/**
 * Returns a specific source selected by ID.
 * @param id ID of the source to return.
 * @return A promise which fulfils with an array of [`Source`](#source) object matching the provided
 * ID, if one exists.
 * @platform ios
 */
export declare function getSourceAsync(id: string): Promise<Source>;
/**
 * Sends an intent to open the specified event in the OS Calendar app.
 * @param id ID of the event to open.
 * @platform android
 */
export declare function openEventInCalendar(id: string): void;
/**
 * @deprecated Use [`requestCalendarPermissionsAsync()`](#calendarrequestcalendarpermissionsasync) instead.
 */
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Checks user's permissions for accessing user's calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export declare function getCalendarPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Checks user's permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export declare function getRemindersPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for accessing user's calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export declare function requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export declare function requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
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
export declare const useCalendarPermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
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
export declare const useRemindersPermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
export declare enum EntityTypes {
    EVENT = "event",
    REMINDER = "reminder"
}
export declare enum Frequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly"
}
export declare enum Availability {
    NOT_SUPPORTED = "notSupported",
    BUSY = "busy",
    FREE = "free",
    TENTATIVE = "tentative",
    UNAVAILABLE = "unavailable"
}
export declare enum CalendarType {
    LOCAL = "local",
    CALDAV = "caldav",
    EXCHANGE = "exchange",
    SUBSCRIBED = "subscribed",
    BIRTHDAYS = "birthdays",
    UNKNOWN = "unknown"
}
export declare enum EventStatus {
    NONE = "none",
    CONFIRMED = "confirmed",
    TENTATIVE = "tentative",
    CANCELED = "canceled"
}
export declare enum SourceType {
    LOCAL = "local",
    EXCHANGE = "exchange",
    CALDAV = "caldav",
    MOBILEME = "mobileme",
    SUBSCRIBED = "subscribed",
    BIRTHDAYS = "birthdays"
}
export declare enum AttendeeRole {
    UNKNOWN = "unknown",
    REQUIRED = "required",
    OPTIONAL = "optional",
    CHAIR = "chair",
    NON_PARTICIPANT = "nonParticipant",
    ATTENDEE = "attendee",
    ORGANIZER = "organizer",
    PERFORMER = "performer",
    SPEAKER = "speaker",
    NONE = "none"
}
export declare enum AttendeeStatus {
    UNKNOWN = "unknown",
    PENDING = "pending",
    ACCEPTED = "accepted",
    DECLINED = "declined",
    TENTATIVE = "tentative",
    DELEGATED = "delegated",
    COMPLETED = "completed",
    IN_PROCESS = "inProcess",
    INVITED = "invited",
    NONE = "none"
}
export declare enum AttendeeType {
    UNKNOWN = "unknown",
    PERSON = "person",
    ROOM = "room",
    GROUP = "group",
    RESOURCE = "resource",
    OPTIONAL = "optional",
    REQUIRED = "required",
    NONE = "none"
}
export declare enum AlarmMethod {
    ALARM = "alarm",
    ALERT = "alert",
    EMAIL = "email",
    SMS = "sms",
    DEFAULT = "default"
}
export declare enum EventAccessLevel {
    CONFIDENTIAL = "confidential",
    PRIVATE = "private",
    PUBLIC = "public",
    DEFAULT = "default"
}
export declare enum CalendarAccessLevel {
    CONTRIBUTOR = "contributor",
    EDITOR = "editor",
    FREEBUSY = "freebusy",
    OVERRIDE = "override",
    OWNER = "owner",
    READ = "read",
    RESPOND = "respond",
    ROOT = "root",
    NONE = "none"
}
export declare enum ReminderStatus {
    COMPLETED = "completed",
    INCOMPLETE = "incomplete"
}
//# sourceMappingURL=Calendar.d.ts.map