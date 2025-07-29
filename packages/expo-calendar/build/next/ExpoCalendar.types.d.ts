import { Source } from '../Calendar';
export declare class CustomExpoCalendar {
    constructor(id: string);
    id: string;
    title: string;
    source: Source;
    type: string;
    allowsModifications: boolean;
    allowedAvailabilities: string[];
    listEventsAsIds(startDate: string | Date, endDate: string | Date): string[];
    /**
     * Lists the event ids of the calendar.
     */
    listEvents(startDate: Date, endDate: Date): CustomExpoCalendarEvent[];
}
export declare class CustomExpoCalendarEvent {
    constructor(id: string);
    readonly id: string;
    readonly title: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly notes: string;
    readonly location: string;
}
export declare function getDefaultCalendar(): CustomExpoCalendar;
export declare function getAllCalendars(entityType?: string): CustomExpoCalendar[];
//# sourceMappingURL=ExpoCalendar.types.d.ts.map