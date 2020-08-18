import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';
export declare type RecurringEventOptions = {
    futureEvents?: boolean;
    instanceStartDate?: string | Date;
};
export interface Calendar {
    id: string;
    title: string;
    sourceId?: string;
    source: Source;
    type?: string;
    color: string;
    entityType?: string;
    allowsModifications: boolean;
    allowedAvailabilities: string[];
    isPrimary?: boolean;
    name?: string | null;
    ownerAccount?: string;
    timeZone?: string;
    allowedReminders?: string[];
    allowedAttendeeTypes?: string[];
    isVisible?: boolean;
    isSynced?: boolean;
    accessLevel?: string;
}
export declare type Source = {
    id?: string;
    type: string;
    name: string;
    isLocalAccount?: boolean;
};
export declare type Event = {
    id: string;
    calendarId: string;
    title: string;
    location: string;
    creationDate?: string | Date;
    lastModifiedDate?: string | Date;
    timeZone: string;
    endTimeZone?: string;
    url?: string;
    notes: string;
    alarms: Alarm[];
    recurrenceRule: RecurrenceRule;
    startDate: string | Date;
    endDate: string | Date;
    originalStartDate?: string | Date;
    isDetached?: boolean;
    allDay: boolean;
    availability: string;
    status: string;
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
export declare type Attendee = {
    id?: string;
    isCurrentUser?: boolean;
    name: string;
    role: string;
    status: string;
    type: string;
    url?: string;
    email?: string;
};
export declare type Alarm = {
    absoluteDate?: string;
    relativeOffset?: number;
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
export declare enum DayOfTheWeek {
    Sunday = 1,
    Monday = 2,
    Tuesday = 3,
    Wednesday = 4,
    Thursday = 5,
    Friday = 6,
    Saturday = 7
}
export declare enum MonthOfTheYear {
    January = 1,
    February = 2,
    March = 3,
    April = 4,
    May = 5,
    June = 6,
    July = 7,
    August = 8,
    September = 9,
    October = 10,
    November = 11,
    December = 12
}
export declare type RecurrenceRule = {
    frequency: string;
    interval?: number;
    endDate?: string | Date;
    occurrence?: number;
    daysOfTheWeek?: {
        dayOfTheWeek: DayOfTheWeek;
        weekNumber?: number;
    }[];
    daysOfTheMonth?: number[];
    monthsOfTheYear?: MonthOfTheYear[];
    weeksOfTheYear?: number[];
    daysOfTheYear?: number[];
    setPositions?: number[];
};
export { PermissionResponse, PermissionStatus };
declare type OptionalKeys<T> = {
    [P in keyof T]?: T[P] | null;
};
/**
 * Returns whether the Calendar API is enabled on the current device. This does not check the app permissions.
 *
 * @returns Async `boolean`, indicating whether the Calendar API is available on the current device. Currently this resolves `true` on iOS and Android only.
 */
export declare function isAvailableAsync(): Promise<boolean>;
export declare function getCalendarsAsync(entityType?: string): Promise<Calendar[]>;
export declare function createCalendarAsync(details?: OptionalKeys<Calendar>): Promise<string>;
export declare function updateCalendarAsync(id: string, details?: OptionalKeys<Calendar>): Promise<string>;
export declare function deleteCalendarAsync(id: string): Promise<void>;
export declare function getEventsAsync(calendarIds: string[], startDate: Date, endDate: Date): Promise<Event[]>;
export declare function getEventAsync(id: string, { futureEvents, instanceStartDate }?: RecurringEventOptions): Promise<Event>;
export declare function createEventAsync(calendarId: string, { id, ...details }?: OptionalKeys<Event>): Promise<string>;
export declare function updateEventAsync(id: string, details?: OptionalKeys<Event>, { futureEvents, instanceStartDate }?: RecurringEventOptions): Promise<string>;
export declare function deleteEventAsync(id: string, { futureEvents, instanceStartDate }?: RecurringEventOptions): Promise<void>;
export declare function getAttendeesForEventAsync(id: string, { futureEvents, instanceStartDate }?: RecurringEventOptions): Promise<Attendee[]>;
export declare function createAttendeeAsync(eventId: string, details?: OptionalKeys<Attendee>): Promise<string>;
export declare function updateAttendeeAsync(id: string, details?: OptionalKeys<Attendee>): Promise<string>;
export declare function getDefaultCalendarAsync(): Promise<Calendar>;
export declare function deleteAttendeeAsync(id: string): Promise<void>;
export declare function getRemindersAsync(calendarIds: (string | null)[], status: string | null, startDate: Date, endDate: Date): Promise<Reminder[]>;
export declare function getReminderAsync(id: string): Promise<Reminder>;
export declare function createReminderAsync(calendarId: string | null, { id, ...details }?: Reminder): Promise<string>;
export declare function updateReminderAsync(id: string, details?: Reminder): Promise<string>;
export declare function deleteReminderAsync(id: string): Promise<void>;
export declare function getSourcesAsync(): Promise<Source[]>;
export declare function getSourceAsync(id: string): Promise<Source>;
export declare function openEventInCalendar(id: string): void;
/**
 * @deprecated Use requestCalendarPermissionsAsync()
 */
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
export declare function getCalendarPermissionsAsync(): Promise<PermissionResponse>;
export declare function getRemindersPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
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
    UNKNOWN: string;
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
