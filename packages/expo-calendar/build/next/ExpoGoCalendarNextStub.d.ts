import type { PermissionResponse } from 'expo-modules-core';
import type { Source } from '../Calendar';
declare class ExpoGoCalendarNextStub {
    static readonly ExpoCalendar: {
        new (): {};
    };
    static readonly ExpoCalendarEvent: {
        new (): {};
    };
    static readonly ExpoCalendarReminder: {
        new (): {};
    };
    static readonly ExpoCalendarAttendee: {
        new (): {};
    };
    getDefaultCalendar(): void;
    getAllCalendars(): void;
    getCalendars(): void;
    createCalendarNext(): void;
    listEvents(): void;
    requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
    getCalendarPermissionsAsync(): Promise<PermissionResponse>;
    requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
    getRemindersPermissionsAsync(): Promise<PermissionResponse>;
    getSources(): Source[];
}
export default ExpoGoCalendarNextStub;
//# sourceMappingURL=ExpoGoCalendarNextStub.d.ts.map