import type { Attendee, Calendar, CalendarDialogParams, DialogEventResult, Event, OpenEventDialogResult, OpenEventPresentationOptions, PresentationOptions, Reminder, Source, PermissionResponse, RecurringEventOptions, ReminderStatus } from './legacy/Calendar';
/**
 * @deprecated Use `calendar.addEventWithForm()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function createEventInCalendarAsync(eventData?: Omit<Partial<Event>, 'id'>, presentationOptions?: PresentationOptions): Promise<DialogEventResult>;
/**
 * @deprecated Use `event.openInCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function openEventInCalendarAsync(params: CalendarDialogParams, presentationOptions?: OpenEventPresentationOptions): Promise<OpenEventDialogResult>;
/**
 * @deprecated Use `event.editInCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function editEventInCalendarAsync(params: CalendarDialogParams, presentationOptions?: PresentationOptions): Promise<DialogEventResult>;
/**
 * @deprecated Import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * @deprecated Use `getCalendars()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getCalendarsAsync(entityType?: string): Promise<Calendar[]>;
/**
 * @deprecated Use `createCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function createCalendarAsync(details?: Partial<Calendar>): Promise<string>;
/**
 * @deprecated Use `calendar.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function updateCalendarAsync(id: string, details?: Partial<Calendar>): Promise<string>;
/**
 * @deprecated Use `calendar.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function deleteCalendarAsync(id: string): Promise<void>;
/**
 * @deprecated Use `listEvents()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getEventsAsync(calendarIds: string[], startDate: Date | string, endDate: Date | string): Promise<Event[]>;
/**
 * @deprecated Use `ExpoCalendarEvent.get()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getEventAsync(id: string, recurringEventOptions?: RecurringEventOptions): Promise<Event>;
/**
 * @deprecated Use `calendar.createEvent()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function createEventAsync(calendarId: string, details?: Partial<Event>): Promise<string>;
/**
 * @deprecated Use `event.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function updateEventAsync(id: string, details?: Partial<Event>, recurringEventOptions?: RecurringEventOptions): Promise<string>;
/**
 * @deprecated Use `event.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function deleteEventAsync(id: string, recurringEventOptions?: RecurringEventOptions): Promise<void>;
/**
 * @deprecated Use `event.getAttendees()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getAttendeesForEventAsync(id: string): Promise<Attendee[]>;
/**
 * @deprecated Use `event.createAttendee()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function createAttendeeAsync(eventId: string, details: Attendee): Promise<string>;
/**
 * @deprecated Use `attendee.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function updateAttendeeAsync(id: string, details?: Partial<Attendee>): Promise<string>;
/**
 * @deprecated Use `attendee.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function deleteAttendeeAsync(id: string): Promise<void>;
/**
 * @deprecated Use `getDefaultCalendarSync()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getDefaultCalendarAsync(): Promise<Calendar>;
/**
 * @deprecated Use `calendar.listReminders()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getRemindersAsync(calendarIds: string[], status: ReminderStatus, startDate?: Date | string, endDate?: Date | string): Promise<Reminder[]>;
/**
 * @deprecated Use `ExpoCalendarReminder.get()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getReminderAsync(id: string): Promise<Reminder>;
/**
 * @deprecated Use `calendar.createReminder()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function createReminderAsync(calendarId: string, details?: Reminder): Promise<string>;
/**
 * @deprecated Use `reminder.update()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function updateReminderAsync(id: string, details?: Reminder): Promise<string>;
/**
 * @deprecated Use `reminder.delete()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function deleteReminderAsync(id: string): Promise<void>;
/**
 * @deprecated Use `getSourcesSync()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getSourcesAsync(): Promise<Source[]>;
/**
 * @deprecated Import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getSourceAsync(id: string): Promise<Source>;
/**
 * @deprecated Use `event.openInCalendar()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function openEventInCalendar(id: string): void;
/**
 * @deprecated Use `requestCalendarPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
/**
 * @deprecated Use `getCalendarPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getCalendarPermissionsAsync(): Promise<PermissionResponse>;
/**
 * @deprecated Use `getRemindersPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function getRemindersPermissionsAsync(): Promise<PermissionResponse>;
/**
 * @deprecated Use `requestCalendarPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
/**
 * @deprecated Use `requestRemindersPermissions()` or import this method from `expo-calendar/legacy`. This method will throw in runtime.
 */
export declare function requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
//# sourceMappingURL=legacyWarnings.d.ts.map