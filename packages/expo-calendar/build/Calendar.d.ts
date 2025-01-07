import { PermissionResponse } from 'expo-modules-core';
export { PermissionResponse, PermissionStatus, PermissionHookOptions, PermissionExpiration, } from 'expo-modules-core';
/**
 * @platform ios
 */
export type RecurringEventOptions = {
    /**
     * Whether future events in the recurring series should also be updated. If `true`, will
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
     * @platform ios
     */
    type?: CalendarType;
    /**
     * Color used to display this calendar's events.
     */
    color: string;
    /**
     * Whether the calendar is used in the Calendar or Reminders OS app.
     * @platform ios
     */
    entityType?: EntityTypes;
    /**
     * Boolean value that determines whether this calendar can be modified.
     */
    allowsModifications: boolean;
    /**
     * Availability types that this calendar supports.
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
     * @platform android
     */
    allowedReminders?: AlarmMethod[];
    /**
     * Attendee types that this calendar supports.
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
     * On iOS, one of [`SourceType`](#sourcetype)s.
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
    recurrenceRule: RecurrenceRule | null;
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
     */
    availability: Availability;
    /**
     * Status of the event.
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
     * Object representing rules for recurring or repeated reminders. `null` for one-time tasks.
     */
    recurrenceRule?: RecurrenceRule | null;
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
     */
    role: AttendeeRole;
    /**
     * Status of the attendee in relation to the event.
     */
    status: AttendeeStatus;
    /**
     * Type of the attendee.
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
 * A method for having the OS automatically remind the user about a calendar item.
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
     * Method of alerting the user that this alarm should use. On iOS this is always a notification.
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
/**
 * @platform ios
 */
export declare enum DayOfTheWeek {
    Sunday = 1,
    Monday = 2,
    Tuesday = 3,
    Wednesday = 4,
    Thursday = 5,
    Friday = 6,
    Saturday = 7
}
/**
 * @platform ios
 */
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
 * Not all the combinations make sense. For example, when frequency is `DAILY`, setting `daysOfTheMonth` makes no sense.
 */
export type RecurrenceRule = {
    /**
     * How often the calendar item should recur.
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
/**
 * Enum containing all possible user responses to the calendar UI dialogs. Depending on what dialog is presented, a subset of the values applies.
 * */
export declare enum CalendarDialogResultActions {
    /**
     * On Android, this is the only possible result because the OS doesn't provide enough information to determine the user's action -
     * the user may have canceled the dialog, modified the event, or deleted it.
     *
     * On iOS, this means the user simply closed the dialog.
     * */
    done = "done",
    /**
     * The user canceled or dismissed the dialog.
     * @platform ios
     * */
    canceled = "canceled",
    /**
     * The user deleted the event.
     * @platform ios
     * */
    deleted = "deleted",
    /**
     * The user responded to and saved a pending event invitation.
     * @platform ios
     * */
    responded = "responded",
    /**
     * The user saved a new event or modified an existing one.
     * @platform ios
     * */
    saved = "saved"
}
/**
 * The result of presenting the calendar dialog for opening (viewing) an event.
 * */
export type OpenEventDialogResult = {
    /**
     * Indicates how user responded to the dialog.
     * On Android, the `action` is always `done`.
     * On iOS, it can be `done`, `canceled`, `deleted` or `responded`.
     * */
    action: Extract<CalendarDialogResultActions, 'done' | 'canceled' | 'deleted' | 'responded'>;
};
/**
 * The result of presenting a calendar dialog for creating or editing an event.
 * */
export type DialogEventResult = {
    /**
     * How user responded to the dialog.
     * On Android, this is always `done` (Android doesn't provide enough information to determine the user's action -
     * the user may have canceled the dialog, saved or deleted the event).
     *
     * On iOS, it can be `saved`, `canceled` or `deleted`.
     * */
    action: Extract<CalendarDialogResultActions, 'done' | 'saved' | 'canceled' | 'deleted'>;
    /**
     * The ID of the event that was created or edited. On Android, this is always `null`.
     *
     * On iOS, this is a string when user confirms the creation or editing of an event. Otherwise, it's `null`.
     * */
    id: string | null;
};
export type PresentationOptions = {
    /**
     * Whether to launch the Activity as a new [task](https://developer.android.com/reference/android/content/Intent#FLAG_ACTIVITY_NEW_TASK).
     * If `true`, the promise resolves with `'done'` action immediately after opening the calendar activity.
     * @default true
     * @platform android
     */
    startNewActivityTask?: boolean;
};
export type OpenEventPresentationOptions = PresentationOptions & {
    /**
     * Whether to allow the user to edit the previewed event.
     * This property applies only to events in calendars created by the user.
     *
     * Note that if the user edits the event, the returned action is the one that user performs last.
     * For example, when user previews the event, confirms some edits and finally dismisses the dialog, the event is edited, but response is `canceled`.
     *
     * @default false
     * @platform ios
     * */
    allowsEditing?: boolean;
    /**
     * Determines whether event can be shown in calendar day view preview.
     * This property applies only to invitations.
     *
     * @default false
     * @platform ios
     * */
    allowsCalendarPreview?: boolean;
};
export type CalendarDialogParams = {
    /**
     * ID of the event to be presented in the calendar UI.
     */
    id: string;
    /**
     * Date object representing the start time of the desired instance, if looking for a single instance
     * of a recurring event. If this is not provided and **id** represents a recurring event, the first
     * instance of that event will be returned by default.
     * @platform ios
     */
    instanceStartDate?: string | Date;
};
/**
 * Launches the calendar UI provided by the OS to create a new event.
 * @param eventData A map of details for the event to be created.
 * @param presentationOptions Configuration that influences how the calendar UI is presented.
 * @return A promise which resolves with information about the dialog result.
 * @header systemProvidedUI
 */
export declare function createEventInCalendarAsync(eventData?: Omit<Partial<Event>, 'id'>, presentationOptions?: PresentationOptions): Promise<DialogEventResult>;
/**
 * Launches the calendar UI provided by the OS to preview an event.
 * @return A promise which resolves with information about the dialog result.
 * @header systemProvidedUI
 */
export declare function openEventInCalendarAsync(params: CalendarDialogParams, presentationOptions?: OpenEventPresentationOptions): Promise<OpenEventDialogResult>;
/**
 * Launches the calendar UI provided by the OS to edit or delete an event. On Android, this is the same as `openEventInCalendarAsync`.
 * @return A promise which resolves with information about the dialog result.
 * @header systemProvidedUI
 */
export declare function editEventInCalendarAsync(params: CalendarDialogParams, presentationOptions?: PresentationOptions): Promise<DialogEventResult>;
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
 * @deprecated Use [`openEventInCalendarAsync`](#openeventincalendarasyncparams-presentationoptions) instead.
 * @header systemProvidedUI
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
 * Checks user's write-only permissions for accessing and modifying user's calendars.
 * This is a more limited scope than full calendar access, checking only event creation and modification permissions.
 *
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export declare function getCalendarWritePermissionsAsync(): Promise<PermissionResponse>;
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
 * Asks the user to grant write-only permissions for accessing and modifying user's calendars.
 * This is a more limited scope than full calendar access, allowing only event creation and modification.
 *
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export declare function requestCalendarWritePermissionsAsync(): Promise<PermissionResponse>;
/**
 * Check or request write-only permissions to access the calendar.
 * This is a more limited scope than full calendar access, allowing only event creation and modification.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Calendar.useCalendarWritePermissions();
 * ```
 * @platform ios
 */
export declare const useCalendarWritePermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
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
export declare const useCalendarPermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
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
export declare const useRemindersPermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * platform ios
 */
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
    /**
     * @platform ios
     */
    NOT_SUPPORTED = "notSupported",
    BUSY = "busy",
    FREE = "free",
    TENTATIVE = "tentative",
    /**
     * @platform ios
     */
    UNAVAILABLE = "unavailable"
}
/**
 * @platform ios
 */
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
/**
 * @platform ios
 */
export declare enum SourceType {
    LOCAL = "local",
    EXCHANGE = "exchange",
    CALDAV = "caldav",
    MOBILEME = "mobileme",
    SUBSCRIBED = "subscribed",
    BIRTHDAYS = "birthdays"
}
export declare enum AttendeeRole {
    /**
     * @platform ios
     */
    UNKNOWN = "unknown",
    /**
     * @platform ios
     */
    REQUIRED = "required",
    /**
     * @platform ios
     */
    OPTIONAL = "optional",
    /**
     * @platform ios
     */
    CHAIR = "chair",
    /**
     * @platform ios
     */
    NON_PARTICIPANT = "nonParticipant",
    /**
     * @platform android
     */
    ATTENDEE = "attendee",
    /**
     * @platform android
     */
    ORGANIZER = "organizer",
    /**
     * @platform android
     */
    PERFORMER = "performer",
    /**
     * @platform android
     */
    SPEAKER = "speaker",
    /**
     * @platform android
     */
    NONE = "none"
}
export declare enum AttendeeStatus {
    /**
     * @platform ios
     */
    UNKNOWN = "unknown",
    /**
     * @platform ios
     */
    PENDING = "pending",
    ACCEPTED = "accepted",
    DECLINED = "declined",
    TENTATIVE = "tentative",
    /**
     * @platform ios
     */
    DELEGATED = "delegated",
    /**
     * @platform ios
     */
    COMPLETED = "completed",
    /**
     * @platform ios
     */
    IN_PROCESS = "inProcess",
    /**
     * @platform android
     */
    INVITED = "invited",
    /**
     * @platform android
     */
    NONE = "none"
}
export declare enum AttendeeType {
    /**
     * @platform ios
     */
    UNKNOWN = "unknown",
    /**
     * @platform ios
     */
    PERSON = "person",
    /**
     * @platform ios
     */
    ROOM = "room",
    /**
     * @platform ios
     */
    GROUP = "group",
    RESOURCE = "resource",
    /**
     * @platform android
     */
    OPTIONAL = "optional",
    /**
     * @platform android
     */
    REQUIRED = "required",
    /**
     * @platform android
     */
    NONE = "none"
}
/**
 * @platform android
 */
export declare enum AlarmMethod {
    ALARM = "alarm",
    ALERT = "alert",
    EMAIL = "email",
    SMS = "sms",
    DEFAULT = "default"
}
/**
 * @platform android
 */
export declare enum EventAccessLevel {
    CONFIDENTIAL = "confidential",
    PRIVATE = "private",
    PUBLIC = "public",
    DEFAULT = "default"
}
/**
 * @platform android
 */
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
/**
 * @platform ios
 */
export declare enum ReminderStatus {
    COMPLETED = "completed",
    INCOMPLETE = "incomplete"
}
//# sourceMappingURL=Calendar.d.ts.map