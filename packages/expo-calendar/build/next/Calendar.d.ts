import { Calendar, EntityTypes, Event, RecurringEventOptions, ReminderStatus } from '../Calendar';
import ExpoCalendar from './ExpoCalendar';
export declare class ExportExpoCalendarAttendee extends ExpoCalendar.CustomExpoCalendarAttendee {
}
export declare class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent {
}
export declare class ExportExpoCalendarReminder extends ExpoCalendar.CustomExpoCalendarReminder {
}
export declare class ExportExpoCalendar extends ExpoCalendar.CustomExpoCalendar {
    createEvent(details: Partial<Event>, options: RecurringEventOptions): ExportExpoCalendarEvent;
    listEvents(startDate: Date, endDate: Date): ExportExpoCalendarEvent[];
    listReminders(startDate: Date, endDate: Date, status?: ReminderStatus | null): Promise<ExportExpoCalendarReminder[]>;
}
export declare function getDefaultCalendarNext(): ExportExpoCalendar;
export declare function getCalendarsNext(type?: EntityTypes): ExportExpoCalendar[];
export declare function createCalendarNext(details?: Partial<Calendar>): ExportExpoCalendar;
//# sourceMappingURL=Calendar.d.ts.map