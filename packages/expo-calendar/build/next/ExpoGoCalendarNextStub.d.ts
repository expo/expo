import type { PermissionResponse } from 'expo-modules-core';
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
    createCalendar(): void;
    getCalendars(): Promise<void>;
    listEvents(): Promise<void>;
    requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
    getCalendarPermissionsAsync(): Promise<PermissionResponse>;
    requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
    getRemindersPermissionsAsync(): Promise<PermissionResponse>;
    getSources(): void;
}
export default ExpoGoCalendarNextStub;
//# sourceMappingURL=ExpoGoCalendarNextStub.d.ts.map