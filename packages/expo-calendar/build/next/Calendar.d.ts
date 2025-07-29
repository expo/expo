import { Calendar, EntityTypes, Event, RecurringEventOptions } from '../Calendar';
import ExpoCalendar from './ExpoCalendar';
export declare class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent {
}
export declare class ExportExpoCalendar extends ExpoCalendar.CustomExpoCalendar {
    createEvent(details: Partial<Event>, options: RecurringEventOptions): ExportExpoCalendarEvent;
    listEvents(startDate: Date, endDate: Date): ExportExpoCalendarEvent[];
}
export declare const getDefaultCalendarNext: () => ExportExpoCalendar;
export declare const getCalendarsNext: (type?: EntityTypes) => ExportExpoCalendar[];
export declare function createCalendar(details?: Partial<Calendar>): string;
//# sourceMappingURL=Calendar.d.ts.map