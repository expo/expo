import { PermissionResponse } from 'expo-modules-core';
import { EntityTypes, Source } from '../Calendar';
declare class ExpoCalendar {
    constructor(id: string);
}
declare class ExpoCalendarEvent {
    constructor();
}
declare class ExpoCalendarAttendee {
    constructor();
}
declare class ExpoCalendarReminder {
    constructor();
}
declare const _default: {
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
    requestCalendarPermissions(): Promise<PermissionResponse>;
    getCalendarPermissions(): Promise<PermissionResponse>;
    requestRemindersPermissions(): Promise<PermissionResponse>;
    getRemindersPermissions(): Promise<PermissionResponse>;
    getSourcesSync(): Source[];
};
export default _default;
//# sourceMappingURL=ExpoCalendar.web.d.ts.map