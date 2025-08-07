import { Calendar, EntityTypes, Event, RecurringEventOptions, Reminder, ReminderStatus } from '../Calendar';
import InternalExpoCalendar from './ExpoCalendar';
import { ModifiableEventProperties, ModifableReminderProperties, ModifableCalendarProperties } from './ExpoCalendar.types';
/**
 * Represents a calendar attendee object.
 */
export declare class ExpoCalendarAttendee extends InternalExpoCalendar.ExpoCalendarAttendee {
}
/**
 * Represents a calendar event object that can be accessed and modified using the Expo Calendar Next API.
 */
export declare class ExpoCalendarEvent extends InternalExpoCalendar.ExpoCalendarEvent {
    getOccurrence(recurringEventOptions?: RecurringEventOptions): ExpoCalendarEvent;
    getAttendees(recurringEventOptions?: RecurringEventOptions): ExpoCalendarAttendee[];
    update(details: Partial<ModifiableEventProperties>, options?: RecurringEventOptions): void;
    delete(options?: RecurringEventOptions): void;
}
/**
 * Represents a calendar reminder object that can be accessed and modified using the Expo Calendar Next API.
 *
 * @platform ios
 */
export declare class ExpoCalendarReminder extends InternalExpoCalendar.ExpoCalendarReminder {
    update(details: Partial<ModifableReminderProperties>): void;
}
/**
 * Represents a calendar object that can be accessed and modified using the Expo Calendar Next API.
 *
 * This class provides properties and methods for interacting with a specific calendar on the device,
 * such as retrieving its events, updating its details, and accessing its metadata.
 */
export declare class ExpoCalendar extends InternalExpoCalendar.ExpoCalendar {
    createEvent(details: Partial<Event>): ExpoCalendarEvent;
    createReminder(details: Partial<Reminder>): ExpoCalendarReminder;
    listEvents(startDate: Date, endDate: Date): ExpoCalendarEvent[];
    listReminders(startDate?: Date | null, endDate?: Date | null, status?: ReminderStatus | null): Promise<ExpoCalendarReminder[]>;
    update(details: Partial<ModifableCalendarProperties>): void;
}
/**
 * Gets an instance of the default calendar object.
 * @return An [`ExpoCalendar`](#expocalendar) object that is the user's default calendar.
 * @platform ios
 */
export declare function getDefaultCalendarNext(): ExpoCalendar;
/**
 * Gets an array of [`ExpoCalendar`](#expocalendar) shared objects with details about the different calendars stored on the device.
 * @param entityType __iOS Only.__ Not required, but if defined, filters the returned calendars to
 * a specific [entity type](#entitytypes). Possible values are `Calendar.EntityTypes.EVENT` (for calendars shown in
 * the Calendar app) and `Calendar.EntityTypes.REMINDER` (for the Reminders app).
 * > **Note:** If not defined, you will need both permissions: **CALENDAR** and **REMINDERS**.
 * @return An array of [`ExpoCalendar`](#expocalendar) shared objects matching the provided entity type (if provided).
 */
export declare function getCalendarsNext(type?: EntityTypes): ExpoCalendar[];
/**
 * Creates a new calendar on the device, allowing events to be added later and displayed in the OS Calendar app.
 * @param details A map of details for the calendar to be created.
 * @returns An [`ExpoCalendar`](#expocalendar) object representing the newly created calendar.
 */
export declare function createCalendarNext(details?: Partial<Calendar>): ExpoCalendar;
/**
 * Lists events from the device's calendar. It can be used to search events in multiple calendars.
 * > **Note:** If you want to search events in a single calendar, you can use [`ExpoCalendar.listEvents`](#listeventsstartdate-enddate) instead.
 * @param calendarIds An array of calendar IDs to search for events.
 * @param startDate The start date of the time range to search for events.
 * @param endDate The end date of the time range to search for events.
 * @returns An array of [`ExpoCalendarEvent`](#expocalendarevent) objects representing the events found.
 */
export declare function listEvents(calendarIds: string[], startDate: Date, endDate: Date): ExpoCalendarEvent[];
/**
 * Asks the user to grant permissions for accessing user's calendars.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export declare const requestCalendarPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
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
export declare const getCalendarPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
/**
 * Asks the user to grant permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export declare const requestRemindersPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
/**
 * Checks user's permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 * @platform ios
 */
export declare const getRemindersPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
/**
 * Gets an array of Source objects with details about the different sources stored on the device.
 * @returns An array of Source objects representing the sources found.
 * @platform ios
 */
export declare const getSources: () => import("./Calendar").Source[];
export type { Calendar, Event, Reminder, PermissionResponse, Alarm, AlarmLocation, Attendee, CalendarDialogParams, DaysOfTheWeek, DialogEventResult, OpenEventDialogResult, OpenEventPresentationOptions, PermissionExpiration, PermissionHookOptions, PresentationOptions, RecurrenceRule, RecurringEventOptions, Source, } from '../Calendar';
export { AlarmMethod, AttendeeRole, AttendeeStatus, AttendeeType, Availability, CalendarAccessLevel, CalendarDialogResultActions, CalendarType, DayOfTheWeek, EntityTypes, EventAccessLevel, EventStatus, Frequency, MonthOfTheYear, ReminderStatus, SourceType, } from '../Calendar';
export { useCalendarPermissions, useRemindersPermissions } from '../Calendar';
//# sourceMappingURL=Calendar.d.ts.map