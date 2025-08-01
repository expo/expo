import { NativeModule, PermissionResponse } from 'expo-modules-core';
import { CustomExpoCalendar, CustomExpoCalendarAttendee, CustomExpoCalendarEvent, CustomExpoCalendarReminder } from './ExpoCalendar.types';
import { Calendar, EntityTypes, Source } from '../Calendar';
declare class ExpoCalendarNextModule extends NativeModule {
    CustomExpoCalendar: typeof CustomExpoCalendar;
    CustomExpoCalendarEvent: typeof CustomExpoCalendarEvent;
    CustomExpoCalendarAttendee: typeof CustomExpoCalendarAttendee;
    CustomExpoCalendarReminder: typeof CustomExpoCalendarReminder;
    getDefaultCalendarId(): string;
    getCalendarsIds(type?: EntityTypes): string[];
    createCalendarNext(details: Partial<Calendar>): CustomExpoCalendar;
    requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
    getCalendarPermissionsAsync(): Promise<PermissionResponse>;
    requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
    getRemindersPermissionsAsync(): Promise<PermissionResponse>;
    getSources(): Source[];
}
declare const _default: ExpoCalendarNextModule;
export default _default;
//# sourceMappingURL=ExpoCalendar.d.ts.map