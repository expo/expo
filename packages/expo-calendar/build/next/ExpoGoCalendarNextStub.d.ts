import type { PermissionResponse } from 'expo';
declare class ExpoGoCalendarNextStub {
    static readonly ExpoCalendar: {
        new (): {
            addEventWithForm(): void;
        };
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
    presentPicker(): Promise<void>;
    requestCalendarPermissions(writeOnly?: boolean): Promise<PermissionResponse>;
    getCalendarPermissions(writeOnly?: boolean): Promise<PermissionResponse>;
    requestRemindersPermissions(): Promise<PermissionResponse>;
    getRemindersPermissions(): Promise<PermissionResponse>;
    getSourcesSync(): void;
}
export default ExpoGoCalendarNextStub;
//# sourceMappingURL=ExpoGoCalendarNextStub.d.ts.map