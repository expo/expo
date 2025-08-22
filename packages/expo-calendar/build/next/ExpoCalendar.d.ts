import { NativeModule, PermissionResponse } from 'expo-modules-core';
import { ExpoCalendar, ExpoCalendarAttendee, ExpoCalendarEvent, ExpoCalendarReminder } from './ExpoCalendar.types';
import { Calendar, EntityTypes, Source } from '../Calendar';
declare class ExpoCalendarNextModule extends NativeModule {
    ExpoCalendar: typeof ExpoCalendar;
    ExpoCalendarEvent: typeof ExpoCalendarEvent;
    ExpoCalendarAttendee: typeof ExpoCalendarAttendee;
    ExpoCalendarReminder: typeof ExpoCalendarReminder;
    getDefaultCalendar(): ExpoCalendar;
    getCalendars(type?: EntityTypes): Promise<ExpoCalendar[]>;
    createCalendarNext(details: Partial<Calendar>): Promise<ExpoCalendar>;
    listEvents(calendarIds: string[], startDate: string | Date, endDate: string | Date): Promise<ExpoCalendarEvent[]>;
    getCalendarById(calendarId: string): ExpoCalendar;
    getEventById(eventId: string): ExpoCalendarEvent;
    getReminderById(reminderId: string): ExpoCalendarReminder;
    requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
    getCalendarPermissionsAsync(): Promise<PermissionResponse>;
    requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
    getRemindersPermissionsAsync(): Promise<PermissionResponse>;
    getSources(): Source[];
}
declare const _default: ExpoCalendarNextModule;
export default _default;
//# sourceMappingURL=ExpoCalendar.d.ts.map