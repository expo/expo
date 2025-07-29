import { EntityTypes, Event, RecurringEventOptions } from '../Calendar';
import ExpoCalendar from './ExpoCalendar';
export declare class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent {
    constructor(id: string);
}
export declare class ExportExpoCalendar extends ExpoCalendar.CustomExpoCalendar {
    constructor(id: string);
    createEvent(details: Partial<Event>, options: RecurringEventOptions): ExportExpoCalendarEvent;
    listEvents(startDate: Date, endDate: Date): ExportExpoCalendarEvent[];
}
export declare const getDefaultCalendarNext: () => ExportExpoCalendar;
export declare const getCalendarsNext: (type?: EntityTypes) => ExportExpoCalendar[];
//# sourceMappingURL=Calendar.d.ts.map