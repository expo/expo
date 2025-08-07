import { Calendar, EntityTypes, Event, RecurringEventOptions, Reminder, ReminderStatus } from '../Calendar';
import InternalExpoCalendar from './ExpoCalendar';
import { ModifiableEventProperties, ModifableReminderProperties, ModifableCalendarProperties } from './ExpoCalendar.types';
export declare class ExpoCalendarAttendee extends InternalExpoCalendar.ExpoCalendarAttendee {
}
export declare class ExpoCalendarEvent extends InternalExpoCalendar.ExpoCalendarEvent {
    getOccurrence(recurringEventOptions?: RecurringEventOptions): ExpoCalendarEvent;
    getAttendees(recurringEventOptions?: RecurringEventOptions): ExpoCalendarAttendee[];
    update(details: Partial<ModifiableEventProperties>, options?: RecurringEventOptions): void;
    delete(options?: RecurringEventOptions): void;
}
export declare class ExpoCalendarReminder extends InternalExpoCalendar.ExpoCalendarReminder {
    update(details: Partial<ModifableReminderProperties>): void;
}
export declare class ExpoCalendar extends InternalExpoCalendar.ExpoCalendar {
    createEvent(details: Partial<Event>): ExpoCalendarEvent;
    createReminder(details: Partial<Reminder>): ExpoCalendarReminder;
    listEvents(startDate: Date, endDate: Date): ExpoCalendarEvent[];
    listReminders(startDate?: Date | null, endDate?: Date | null, status?: ReminderStatus | null): Promise<ExpoCalendarReminder[]>;
    update(details: Partial<ModifableCalendarProperties>): void;
}
export declare function getDefaultCalendarNext(): ExpoCalendar;
export declare function getCalendarsNext(type?: EntityTypes): ExpoCalendar[];
export declare function createCalendarNext(details?: Partial<Calendar>): ExpoCalendar;
export declare function listEvents(calendarIds: string[], startDate: Date, endDate: Date): ExpoCalendarEvent[];
export declare const requestCalendarPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
export declare const getCalendarPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
export declare const requestRemindersPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
export declare const getRemindersPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
export declare const getSources: () => import("../Calendar").Source[];
//# sourceMappingURL=Calendar.d.ts.map