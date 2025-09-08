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
    getDefaultCalendarSync(): void;
    createCalendar(): void;
    getCalendars(): Promise<void>;
    listEvents(): Promise<void>;
    requestCalendarPermissions(): Promise<PermissionResponse>;
    getCalendarPermissions(): Promise<PermissionResponse>;
    requestRemindersPermissions(): Promise<PermissionResponse>;
    getRemindersPermissions(): Promise<PermissionResponse>;
    getSourcesSync(): void;
}
export default ExpoGoCalendarNextStub;
//# sourceMappingURL=ExpoGoCalendarNextStub.d.ts.map