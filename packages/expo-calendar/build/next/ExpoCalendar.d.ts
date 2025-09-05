import { NativeModule, PermissionResponse } from 'expo-modules-core';
import { ExpoCalendar, ExpoCalendarAttendee, ExpoCalendarEvent, ExpoCalendarReminder } from './ExpoCalendar.types';
import { EntityTypes, Source } from '../Calendar';
declare class ExpoCalendarNextModule extends NativeModule {
    ExpoCalendar: typeof ExpoCalendar;
    ExpoCalendarEvent: typeof ExpoCalendarEvent;
    ExpoCalendarAttendee: typeof ExpoCalendarAttendee;
    ExpoCalendarReminder: typeof ExpoCalendarReminder;
    getDefaultCalendar(): ExpoCalendar;
    getCalendars(type?: EntityTypes): Promise<ExpoCalendar[]>;
    listEvents(calendars: string[], startDate: string | Date, endDate: string | Date): Promise<ExpoCalendarEvent[]>;
    getCalendarById(calendarId: string): Promise<ExpoCalendar>;
    getEventById(eventId: string): Promise<ExpoCalendarEvent>;
    getReminderById(reminderId: string): Promise<ExpoCalendarReminder>;
    requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
    getCalendarPermissionsAsync(): Promise<PermissionResponse>;
    requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
    getRemindersPermissionsAsync(): Promise<PermissionResponse>;
    getSources(): Source[];
}
declare const _default: ExpoCalendarNextModule;
export default _default;
//# sourceMappingURL=ExpoCalendar.d.ts.map