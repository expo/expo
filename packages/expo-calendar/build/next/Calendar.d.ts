import { Calendar, Attendee, DialogEventResult, EntityTypes, Event, OpenEventDialogResult, RecurringEventOptions, Reminder, ReminderStatus } from '../Calendar';
import InternalExpoCalendar from './ExpoCalendar';
import { ModifiableEventProperties, ModifiableReminderProperties, ModifiableCalendarProperties, CalendarDialogOpenParamsNext, CalendarDialogParamsNext, ModifiableAttendeeProperties } from './ExpoCalendar.types';
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
    openInCalendarAsync(params?: CalendarDialogOpenParamsNext): Promise<OpenEventDialogResult>;
    editInCalendarAsync(params?: CalendarDialogParamsNext): Promise<DialogEventResult>;
    getOccurrence(recurringEventOptions?: RecurringEventOptions): ExpoCalendarEvent;
    getAttendeesAsync(): Promise<ExpoCalendarAttendee[]>;
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
    static get(calendarId: string): Promise<ExpoCalendar>;
}
/**
 * Gets an instance of the default calendar object.
 * @return An [`ExpoCalendar`](#expocalendar) object that is the user's default calendar.
 */
export declare function getDefaultCalendar(): ExpoCalendar;
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
 */
export declare const requestRemindersPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
/**
 * Checks user's permissions for accessing user's reminders.
 * @return A promise that resolves to an object of type [`PermissionResponse`](#permissionresponse).
 */
export declare const getRemindersPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
/**
 * Gets an array of Source objects with details about the different sources stored on the device.
 * @returns An array of Source objects representing the sources found.
 */
export declare const getSources: () => import("./Calendar").Source[];
export type { ModifiableEventProperties, ModifiableReminderProperties, ModifiableCalendarProperties, } from './ExpoCalendar.types';
export type { PermissionResponse, Alarm, AlarmLocation, CalendarDialogParams, DaysOfTheWeek, DialogEventResult, OpenEventDialogResult, OpenEventPresentationOptions, PermissionExpiration, PermissionHookOptions, PresentationOptions, RecurrenceRule, RecurringEventOptions, Source, } from '../Calendar';
export { AlarmMethod, AttendeeRole, AttendeeStatus, AttendeeType, Availability, CalendarAccessLevel, CalendarDialogResultActions, CalendarType, DayOfTheWeek, EntityTypes, EventAccessLevel, EventStatus, Frequency, MonthOfTheYear, ReminderStatus, SourceType, createEventInCalendarAsync, openEventInCalendarAsync, } from '../Calendar';
export { useCalendarPermissions, useRemindersPermissions } from '../Calendar';
//# sourceMappingURL=Calendar.d.ts.map