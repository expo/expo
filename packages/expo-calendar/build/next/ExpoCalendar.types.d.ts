import { AttendeeRole, AttendeeStatus, AttendeeType, Source, Event, RecurringEventOptions, CalendarType, Availability, EntityTypes, Alarm, RecurrenceRule, EventStatus, Organizer } from '../Calendar';
export declare class CustomExpoCalendar {
    constructor(id: string);
    id: string;
    title: string;
    sourceId?: string;
    source: Source;
    type?: CalendarType;
    color: string;
    entityType?: EntityTypes;
    allowsModifications: boolean;
    allowedAvailabilities: Availability[];
    /**
     * Lists the event ids of the calendar.
     */
    listEvents(startDate: Date | string, endDate: Date | string): CustomExpoCalendarEvent[];
    createEvent(details: Partial<Event>, options: RecurringEventOptions): CustomExpoCalendarEvent;
    delete(): void;
}
export declare class CustomExpoCalendarEvent {
    constructor(id: string);
    readonly id: string;
    readonly calendarId: string;
    readonly title: string;
    location: string | null;
    creationDate?: string | Date;
    lastModifiedDate?: string | Date;
    timeZone: string;
    endTimeZone?: string;
    url?: string;
    notes: string;
    alarms: Alarm[];
    recurrenceRule: RecurrenceRule | null;
    startDate: string | Date;
    endDate: string | Date;
    originalStartDate?: string | Date;
    isDetached?: boolean;
    allDay: boolean;
    availability: Availability;
    status: EventStatus;
    organizer?: Organizer;
    originalId?: string;
    getAttendees(): CustomExpoCalendarAttendee[];
    delete(): void;
}
export declare class CustomExpoCalendarAttendee {
    constructor(id: string);
    id?: string;
    name: string;
    isCurrentUser: boolean;
    role: AttendeeRole;
    status: AttendeeStatus;
    type: AttendeeType;
    url?: string;
    email?: string;
}
//# sourceMappingURL=ExpoCalendar.types.d.ts.map