import { Calendar, EntityTypes, Event, Reminder, ReminderStatus } from '../Calendar';
import ExpoCalendar from './ExpoCalendar';
export declare class ExportExpoCalendarAttendee extends ExpoCalendar.CustomExpoCalendarAttendee {
}
export declare class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent {
}
export declare class ExportExpoCalendarReminder extends ExpoCalendar.CustomExpoCalendarReminder {
}
export declare class ExportExpoCalendar extends ExpoCalendar.CustomExpoCalendar {
    createEvent(details: Partial<Event>): ExportExpoCalendarEvent;
    createReminder(details: Partial<Reminder>): ExportExpoCalendarReminder;
    listEvents(startDate: Date, endDate: Date): ExportExpoCalendarEvent[];
    listReminders(startDate: Date, endDate: Date, status?: ReminderStatus | null): Promise<ExportExpoCalendarReminder[]>;
    update(details: Partial<Calendar>): void;
}
export declare function getDefaultCalendarNext(): ExportExpoCalendar;
export declare function getCalendarsNext(type?: EntityTypes): ExportExpoCalendar[];
export declare function createCalendarNext(details?: Partial<Calendar>): ExportExpoCalendar;
export declare const requestCalendarPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
export declare const getCalendarPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
export declare const requestRemindersPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
export declare const getRemindersPermissionsAsync: () => Promise<import("expo-modules-core").PermissionResponse>;
export declare const getSources: () => import("../Calendar").Source[];
//# sourceMappingURL=Calendar.d.ts.map