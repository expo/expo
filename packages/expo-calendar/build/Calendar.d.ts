declare type RecurringEventOptions = {
    futureEvents?: boolean;
    instanceStartDate?: string | Date;
};
export interface Calendar {
    id?: string;
    title?: string;
    sourceId?: string;
    source?: Source;
    type?: string;
    color?: string;
    entityType?: string;
    allowsModifications?: boolean;
    allowedAvailabilities?: string[];
    isPrimary?: boolean;
    name?: string;
    ownerAccount?: string;
    timeZone?: string;
    allowedReminders?: string[];
    allowedAttendeeTypes?: string[];
    isVisible?: boolean;
    isSynced?: boolean;
    accessLevel?: string;
}
declare type Source = {
    id?: string;
    type?: string;
    name?: string;
    isLocalAccount?: boolean;
};
export declare type Event = {
    id?: string;
    calendarId?: string;
    title?: string;
    location?: string;
    creationDate?: string | Date;
    lastModifiedDate?: string | Date;
    timeZone?: string;
    endTimeZone?: string;
    url?: string;
    notes?: string;
    alarms?: Alarm[];
    recurrenceRule?: RecurrenceRule;
    startDate?: string | Date;
    endDate?: string | Date;
    originalStartDate?: string | Date;
    isDetached?: boolean;
    allDay?: boolean;
    availability?: string;
    status?: string;
    organizer?: string;
    organizerEmail?: string;
    accessLevel?: string;
    guestsCanModify?: boolean;
    guestsCanInviteOthers?: boolean;
    guestsCanSeeGuests?: boolean;
    originalId?: string;
    instanceId?: string;
};
export interface Reminder {
    id?: string;
    calendarId?: string;
    title?: string;
    location?: string;
    creationDate?: string | Date;
    lastModifiedDate?: string | Date;
    timeZone?: string;
    url?: string;
    notes?: string;
    alarms?: Alarm[];
    recurrenceRule?: RecurrenceRule;
    startDate?: string | Date;
    dueDate?: string | Date;
    completed?: boolean;
    completionDate?: string | Date;
}
declare type Attendee = {
    id?: string;
    isCurrentUser?: boolean;
    name?: string;
    role?: string;
    status?: string;
    type?: string;
    url?: string;
    email?: string;
};
declare type Alarm = {
    absoluteDate?: string;
    relativeOffset?: string;
    structuredLocation?: {
        title?: string;
        proximity?: string;
        radius?: number;
        coords?: {
            latitude?: number;
            longitude?: number;
        };
    };
    method?: string;
};
declare type RecurrenceRule = {
    frequency: string;
    interval?: number;
    endDate?: string;
    occurrence?: number;
};
export declare function getCalendarsAsync(entityType?: string): Promise<void>;
export declare function createCalendarAsync(details?: Calendar): Promise<string>;
export declare function updateCalendarAsync(id: string, details?: Calendar): Promise<string>;
export declare function deleteCalendarAsync(id: string): Promise<void>;
export declare function getEventsAsync(calendarIds: string[], startDate: Date, endDate: Date): Promise<Event[]>;
export declare function getEventAsync(id: string, { futureEvents, instanceStartDate }?: RecurringEventOptions): Promise<Event>;
export declare function createEventAsync(calendarId: string, details?: Event): Promise<string>;
export declare function updateEventAsync(id: string, details?: Event, { futureEvents, instanceStartDate }?: RecurringEventOptions): Promise<string>;
export declare function deleteEventAsync(id: string, { futureEvents, instanceStartDate }?: RecurringEventOptions): Promise<void>;
export declare function getAttendeesForEventAsync(id: string, { futureEvents, instanceStartDate }?: RecurringEventOptions): Promise<Attendee[]>;
export declare function createAttendeeAsync(eventId: string, details?: Attendee): Promise<string>;
export declare function updateAttendeeAsync(id: string, details?: Attendee): Promise<string>;
export declare function deleteAttendeeAsync(id: string): Promise<void>;
export declare function getRemindersAsync(calendarIds: string[], status: string | null, startDate: Date, endDate: Date): Promise<Reminder[]>;
export declare function getReminderAsync(id: string): Promise<Reminder>;
export declare function createReminderAsync(calendarId: string, details?: Reminder): Promise<string>;
export declare function updateReminderAsync(id: string, details?: Reminder): Promise<string>;
export declare function deleteReminderAsync(id: string): Promise<void>;
export declare function getSourcesAsync(): Promise<Source[]>;
export declare function getSourceAsync(id: string): Promise<Source>;
export declare function openEventInCalendar(id: string): void;
export declare function requestPermissionsAsync(): Promise<void>;
export declare function requestRemindersPermissionsAsync(): Promise<void>;
export declare const EntityTypes: {
    EVENT: string;
    REMINDER: string;
};
export declare const Frequency: {
    DAILY: string;
    WEEKLY: string;
    MONTHLY: string;
    YEARLY: string;
};
export declare const Availability: {
    NOT_SUPPORTED: string;
    BUSY: string;
    FREE: string;
    TENTATIVE: string;
    UNAVAILABLE: string;
};
export declare const CalendarType: {
    LOCAL: string;
    CALDAV: string;
    EXCHANGE: string;
    SUBSCRIBED: string;
    BIRTHDAYS: string;
};
export declare const EventStatus: {
    NONE: string;
    CONFIRMED: string;
    TENTATIVE: string;
    CANCELED: string;
};
export declare const SourceType: {
    LOCAL: string;
    EXCHANGE: string;
    CALDAV: string;
    MOBILEME: string;
    SUBSCRIBED: string;
    BIRTHDAYS: string;
};
export declare const AttendeeRole: {
    UNKNOWN: string;
    REQUIRED: string;
    OPTIONAL: string;
    CHAIR: string;
    NON_PARTICIPANT: string;
    ATTENDEE: string;
    ORGANIZER: string;
    PERFORMER: string;
    SPEAKER: string;
    NONE: string;
};
export declare const AttendeeStatus: {
    UNKNOWN: string;
    PENDING: string;
    ACCEPTED: string;
    DECLINED: string;
    TENTATIVE: string;
    DELEGATED: string;
    COMPLETED: string;
    IN_PROCESS: string;
    INVITED: string;
    NONE: string;
};
export declare const AttendeeType: {
    UNKNOWN: string;
    PERSON: string;
    ROOM: string;
    GROUP: string;
    RESOURCE: string;
    OPTIONAL: string;
    REQUIRED: string;
    NONE: string;
};
export declare const AlarmMethod: {
    ALARM: string;
    ALERT: string;
    EMAIL: string;
    SMS: string;
    DEFAULT: string;
};
export declare const EventAccessLevel: {
    CONFIDENTIAL: string;
    PRIVATE: string;
    PUBLIC: string;
    DEFAULT: string;
};
export declare const CalendarAccessLevel: {
    CONTRIBUTOR: string;
    EDITOR: string;
    FREEBUSY: string;
    OVERRIDE: string;
    OWNER: string;
    READ: string;
    RESPOND: string;
    ROOT: string;
    NONE: string;
};
export declare const ReminderStatus: {
    COMPLETED: string;
    INCOMPLETE: string;
};
export declare const DEFAULT = "default";
export {};
