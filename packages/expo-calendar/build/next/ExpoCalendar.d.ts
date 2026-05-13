import { type PermissionResponse } from 'expo';
import { NativeModule } from 'expo-modules-core';
import type { ProcessedColorValue } from 'react-native';
import type { ExpoCalendar, ExpoCalendarAttendee, ExpoCalendarEvent, ExpoCalendarReminder } from './ExpoCalendar.types';
import type { Calendar, EntityTypes, Source } from '../Calendar';
declare class ExpoCalendarNextModule extends NativeModule {
    ExpoCalendar: typeof ExpoCalendar;
    ExpoCalendarEvent: typeof ExpoCalendarEvent;
    ExpoCalendarAttendee: typeof ExpoCalendarAttendee;
    ExpoCalendarReminder: typeof ExpoCalendarReminder;
    createCalendar(details: Omit<Partial<Calendar>, 'color'> & {
        color: ProcessedColorValue | undefined;
    }): Promise<ExpoCalendar>;
    getDefaultCalendar(): ExpoCalendar;
    getDefaultCalendarSync(): unknown;
    getCalendars(type?: EntityTypes): Promise<ExpoCalendar[]>;
    listEvents(calendars: string[], startDate: string | Date, endDate: string | Date): Promise<ExpoCalendarEvent[]>;
    getCalendarById(calendarId: string): Promise<ExpoCalendar>;
    presentPicker(): Promise<ExpoCalendar | null>;
    getEventById(eventId: string): Promise<ExpoCalendarEvent>;
    getReminderById(reminderId: string): Promise<ExpoCalendarReminder>;
    requestCalendarPermissions(writeOnly?: boolean): Promise<PermissionResponse>;
    getCalendarPermissions(writeOnly?: boolean): Promise<PermissionResponse>;
    requestRemindersPermissions(): Promise<PermissionResponse>;
    getRemindersPermissions(): Promise<PermissionResponse>;
    getSourcesSync(): Source[];
}
declare const _default: ExpoCalendarNextModule;
export default _default;
//# sourceMappingURL=ExpoCalendar.d.ts.map