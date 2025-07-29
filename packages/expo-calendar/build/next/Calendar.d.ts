import ExpoCalendar from './ExpoCalendar';
export declare class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent {
    constructor(id: string);
}
export declare class ExportExpoCalendar extends ExpoCalendar.CustomExpoCalendar {
    constructor(id: string);
    listEvents(startDate: Date, endDate: Date): ExportExpoCalendarEvent[];
}
//# sourceMappingURL=Calendar.d.ts.map