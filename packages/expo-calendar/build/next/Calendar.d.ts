import type { Calendar, Attendee, DialogEventResult, EntityTypes, Event, RecurringEventOptions, Reminder, ReminderStatus, PermissionResponse } from '../Calendar';
import InternalExpoCalendar from './ExpoCalendar';
import type { ModifiableEventProperties, ModifiableReminderProperties, ModifiableCalendarProperties, ModifiableAttendeeProperties, AddEventWithFormOptions } from './ExpoCalendar.types';
/**
 * Represents a calendar attendee object.
 */
export declare class ExpoCalendarAttendee extends InternalExpoCalendar.ExpoCalendarAttendee {
    update(details: Partial<ModifiableAttendeeProperties>): Promise<void>;
    delete(): Promise<void>;
}
/**
 * Represents a calendar event object that can be accessed and modified using the Expo Calendar Next API.
 */
export declare class ExpoCalendarEvent extends InternalExpoCalendar.ExpoCalendarEvent {
    getOccurrenceSync(recurringEventOptions?: RecurringEventOptions): ExpoCalendarEvent;
    getAttendees(): Promise<ExpoCalendarAttendee[]>;
    createAttendee(attendee: Attendee): Promise<ExpoCalendarAttendee>;
    update(details: Partial<ModifiableEventProperties>): Promise<void>;
    delete(): Promise<void>;
    static get(eventId: string): Promise<ExpoCalendarEvent>;
}
/**
 * Represents a calendar reminder object that can be accessed and modified using the Expo Calendar Next API.
 */
export declare class ExpoCalendarReminder extends InternalExpoCalendar.ExpoCalendarReminder {
    update(details: Partial<ModifiableReminderProperties>): Promise<void>;
    static get(reminderId: string): Promise<ExpoCalendarReminder>;
}
/**
 * Represents a calendar object that can be accessed and modified using the Expo Calendar Next API.
 *
 * This class provides properties and methods for interacting with a specific calendar on the device,
 * such as retrieving its events, updating its details, and accessing its metadata.
 */
export declare class ExpoCalendar extends InternalExpoCalendar.ExpoCalendar {
    createEvent(details: Partial<Omit<Event, 'creationDate' | 'lastModifiedDate' | 'originalStartDate' | 'isDetached' | 'status' | 'organizer'>>): Promise<ExpoCalendarEvent>;
    createReminder(details: Partial<Reminder>): Promise<ExpoCalendarReminder>;
    listEvents(startDate: Date, endDate: Date): Promise<ExpoCalendarEvent[]>;
    listReminders(startDate?: Date | null, endDate?: Date | null, status?: ReminderStatus | null): Promise<ExpoCalendarReminder[]>;
    update(details: Partial<ModifiableCalendarProperties>): Promise<void>;
    addEventWithForm(options?: AddEventWithFormOptions): Promise<DialogEventResult>;
    static get(calendarId: string): Promise<ExpoCalendar>;
}
/**
 * Gets an instance of the default calendar object.
 * @return An [`ExpoCalendar`](#expocalendar) object that is the user's default calendar.
 */
export declare function getDefaultCalendarSync(): ExpoCalendar;
/**
 * Gets an array of [`ExpoCalendar`](#expocalendar) shared objects with details about the different calendars stored on the device.
 * @param entityType __iOS Only.__ Not required, but if defined, filters the returned calendars to
 * a specific [entity type](#entitytypes). Possible values are `Calendar.EntityTypes.EVENT` (for calendars shown in
 * the Calendar app) and `Calendar.EntityTypes.REMINDER` (for the Reminders app).
 * > **Note:** If not defined, you will need both permissions: **CALENDAR** and **REMINDERS**.
 * @return An array of [`ExpoCalendar`](#expocalendar) shared objects matching the provided entity type (if provided).
 */
export declare function getCalendars(type?: EntityTypes): Promise<ExpoCalendar[]>;
/**
 * Creates a new calendar on the device, allowing events to be added later and displayed in the OS Calendar app.
 * @param details A map of details for the calendar to be created.
 * @returns An [`ExpoCalendar`](#expocalendar) object representing the newly created calendar.
 */
export declare function createCalendar(details?: Partial<Calendar>): Promise<ExpoCalendar>;
/**
 * Presents the OS calendar picker and returns the selected calendar.
 * @return An [`ExpoCalendar`](#expocalendar) object or `null` when the picker is cancelled.
 * @platform ios
 */
export declare function presentPicker(): Promise<ExpoCalendar | null>;
/**
 * Lists events from the device's calendar. It can be used to search events in multiple calendars.
 * > **Note:** If you want to search events in a single calendar, you can use [`ExpoCalendar.listEvents`](#listeventsstartdate-enddate) instead.
 * @param calendars An array of calendar IDs (`string[]`) or [`ExpoCalendar`](#expocalendar) objects to search for events.
 * @param startDate The start date of the time range to search for events.
 * @param endDate The end date of the time range to search for events.
 * @returns An array of [`ExpoCalendarEvent`](#expocalendarevent) objects representing the events found.
 */
export declare function listEvents(calendars: (string | ExpoCalendar)[], startDate: Date, endDate: Date): Promise<ExpoCalendarEvent[]>;
/**
 * Asks the user to grant permissions for accessing user's calendars.
 * @param writeOnly - On iOS, whether to request write-only access, which allows creating calendar events
 * without reading existing calendars or events. This does not grant permission to create, update, or delete calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export declare const requestCalendarPermissions: (writeOnly?: boolean) => Promise<PermissionResponse>;
/**
 * Checks user's permissions for accessing user's calendars.
 * @param writeOnly - On iOS, whether to check write-only access, which allows creating calendar events
 * without reading existing calendars or events. This does not grant permission to create, update, or delete calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export declare const getCalendarPermissions: (writeOnly?: boolean) => Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export declare const requestRemindersPermissions: () => Promise<PermissionResponse>;
/**
 * Checks user's permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export declare const getRemindersPermissions: () => Promise<PermissionResponse>;
/**
 * Gets an array of Source objects with details about the different sources stored on the device.
 * @returns An array of Source objects representing the sources found.
 */
export declare const getSourcesSync: () => import("./Calendar").Source[];
export type { ModifiableEventProperties, ModifiableReminderProperties, ModifiableCalendarProperties, AddEventWithFormOptions, } from './ExpoCalendar.types';
export type { PermissionResponse, Alarm, AlarmLocation, CalendarDialogParams, DaysOfTheWeek, DialogEventResult, OpenEventDialogResult, OpenEventPresentationOptions, PermissionExpiration, PermissionHookOptions, PresentationOptions, RecurrenceRule, RecurringEventOptions, Source, } from '../Calendar';
export { AlarmMethod, AttendeeRole, AttendeeStatus, AttendeeType, Availability, CalendarAccessLevel, CalendarDialogResultActions, CalendarType, DayOfTheWeek, EntityTypes, EventAccessLevel, EventStatus, Frequency, MonthOfTheYear, ReminderStatus, SourceType, createEventInCalendarAsync, openEventInCalendarAsync, } from '../Calendar';
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
export declare const useCalendarPermissions: (options?: import("expo-modules-core").PermissionHookOptions<{
    writeOnly?: boolean;
}> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * Check or request permissions to access the user's reminders.
 * This uses both `getRemindersPermissions` and `requestRemindersPermissions` to interact
 * with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Calendar.useRemindersPermissions();
 * ```
 */
export declare const useRemindersPermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
//# sourceMappingURL=Calendar.d.ts.map