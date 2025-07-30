import { Calendar, EntityTypes, Event, RecurringEventOptions } from '../Calendar';
import ExpoCalendar from './ExpoCalendar';
export declare class ExportExpoCalendarAttendee extends ExpoCalendar.CustomExpoCalendarAttendee {
}
export declare class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent {
}
export declare class ExportExpoCalendar extends ExpoCalendar.CustomExpoCalendar {
    createEvent(details: Partial<Event>, options: RecurringEventOptions): ExportExpoCalendarEvent;
    listEvents(startDate: Date, endDate: Date): ExportExpoCalendarEvent[];
}
export declare function getDefaultCalendarNext(): ExportExpoCalendar;
export declare function getCalendarsNext(type?: EntityTypes): ExportExpoCalendar[];
export declare function createCalendarNext(details?: Partial<Calendar>): ExportExpoCalendar;
//# sourceMappingURL=Calendar.d.ts.map