import type { PermissionResponse } from 'expo-modules-core';
import type { CalendarPermissionOptions } from './ExpoCalendar.types';
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
    requestCalendarPermissions(options?: CalendarPermissionOptions): Promise<PermissionResponse>;
    getCalendarPermissions(options?: CalendarPermissionOptions): Promise<PermissionResponse>;
    requestRemindersPermissions(): Promise<PermissionResponse>;
    getRemindersPermissions(): Promise<PermissionResponse>;
    getSourcesSync(): void;
}
export default ExpoGoCalendarNextStub;
//# sourceMappingURL=ExpoGoCalendarNextStub.d.ts.map