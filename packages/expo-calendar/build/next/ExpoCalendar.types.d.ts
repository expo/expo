import { AttendeeRole, AttendeeStatus, AttendeeType, Source, Event, RecurringEventOptions, CalendarType, Availability, EntityTypes, Alarm, RecurrenceRule, EventStatus, Organizer, ReminderStatus, Calendar, Reminder, CalendarDialogParams, DialogEventResult, OpenEventPresentationOptions, PresentationOptions } from '../Calendar';
type CalendarDialogParamsNext = Omit<CalendarDialogParams, 'id'> & PresentationOptions;
type CalendarDialogOpenParamsNext = CalendarDialogParamsNext & OpenEventPresentationOptions;
export type ModifiableCalendarProperties = Pick<Calendar, 'color' | 'title'>;
export type ModifiableEventProperties = Pick<Event, 'title' | 'location' | 'timeZone' | 'url' | 'notes' | 'alarms' | 'recurrenceRule' | 'availability' | 'startDate' | 'endDate' | 'allDay'>;
export type ModifiableReminderProperties = Pick<Reminder, 'title' | 'location' | 'timeZone' | 'url' | 'notes' | 'alarms' | 'recurrenceRule' | 'startDate' | 'dueDate' | 'completed' | 'completionDate'>;
export declare class ExpoCalendar {
    constructor(id: string);
    /**
     * Internal ID that represents this calendar on the device.
     */
    id: string;
    /**
     * Visible name of the calendar.
     */
    title: string;
    /**
     * ID of the source to be used for the calendar. Likely the same as the source for any other
     * locally stored calendars.
     */
    sourceId?: string;
    /**
     * Object representing the source to be used for the calendar.
     */
    source: Source;
    /**
     * Type of calendar this object represents.
     */
    type?: CalendarType;
    /**
     * Color used to display this calendar's events.
     */
    color: string;
    /**
     * Whether the calendar is used in the Calendar or Reminders OS app.
     */
    entityType?: EntityTypes;
    /**
     * Boolean value that determines whether this calendar can be modified.
     */
    allowsModifications: boolean;
    /**
     * Availability types that this calendar supports.
     */
    allowedAvailabilities: Availability[];
    /**
     * Returns a calendar event list for the given date range.
     */
    listEvents(startDate: Date | string, endDate: Date | string): ExpoCalendarEvent[];
    /**
     * Returns a list of reminders matching the provided criteria. If `startDate` and `endDate` are defined,
     * returns all reminders that overlap at all with the `[startDate, endDate]` interval, that is, all reminders
     * that end after the `startDate` or begin before the `endDate`.
     * @param startDate Beginning of time period to search for reminders in, or `null` for all completed reminders before `endDate`.
     * @param endDate End of time period to search for reminders in, or `null` for all completed reminders after `startDate`.
     * @param status One of `Calendar.ReminderStatus.COMPLETED` or `Calendar.ReminderStatus.INCOMPLETE`. If not defined, both completed and incomplete reminders will be returned.
     * @return An array of [`ExpoCalendarReminder`](#expocalendarreminder) objects matching the search criteria.
     */
    listReminders(startDate?: Date | string | null, endDate?: Date | string | null, status?: ReminderStatus | null): Promise<ExpoCalendarReminder[]>;
    /**
     * Creates a new event in the calendar.
     * @param eventData A map of details for the event to be created.
     * @return An instance of the created event.
     */
    createEvent(eventData: Omit<Partial<Event>, 'id' | 'organizer'>): ExpoCalendarEvent;
    /**
     * Creates a new reminder in the calendar.
     * @param reminderData A map of details for the reminder to be created.
     * @return An instance of the created reminder.
     */
    createReminder(reminderData: Omit<Partial<Reminder>, 'id' | 'calendarId'>): ExpoCalendarReminder;
    /**
     * Updates the provided details of an existing calendar stored on the device. To remove a property,
     * explicitly set it to `null` in `details`.
     * @param details A map of properties to be updated.
     */
    update(details: Partial<ModifiableCalendarProperties>): void;
    /**
     * Deletes the calendar.
     */
    delete(): void;
}
export declare class ExpoCalendarEvent {
    constructor(id: string);
    /**
     * Internal ID that represents this event on the device.
     */
    id: string;
    /**
     * ID of the calendar that contains this event.
     */
    calendarId: string;
    /**
     * Visible name of the event.
     */
    title: string;
    /**
     * Location field of the event.
     */
    location: string | null;
    /**
     * Date when the event record was created.
     */
    creationDate?: string | Date;
    /**
     * Date when the event record was last modified.
     */
    lastModifiedDate?: string | Date;
    /**
     * Time zone the event is scheduled in.
     */
    timeZone: string;
    /**
     * URL for the event.
     */
    url?: string;
    /**
     * Description or notes saved with the event.
     */
    notes: string;
    /**
     * Array of Alarm objects which control automated reminders to the user.
     */
    alarms: Alarm[];
    /**
     * Object representing rules for recurring or repeating events. Set to `null` for one-time events.
     */
    recurrenceRule: RecurrenceRule | null;
    /**
     * Date object or string representing the time when the event starts.
     */
    startDate: string | Date;
    /**
     * Date object or string representing the time when the event ends.
     */
    endDate: string | Date;
    /**
     * For recurring events, the start date for the first (original) instance of the event.
     */
    originalStartDate?: string | Date;
    /**
     * Boolean value indicating whether or not the event is a detached (modified) instance of a recurring event.
     */
    isDetached?: boolean;
    /**
     * Whether the event is displayed as an all-day event on the calendar
     */
    allDay: boolean;
    /**
     * The availability setting for the event.
     */
    availability: Availability;
    /**
     * Status of the event.
     */
    status: EventStatus;
    /**
     * Organizer of the event.
     * This property is only available on events associated with calendars that are managed by a service such as Google Calendar or iCloud.
     * The organizer is read-only and cannot be set.
     */
    organizer?: Organizer;
    /**
     * Launches the calendar UI provided by the OS to preview an event.
     * @return A promise which resolves with information about the dialog result.
     * @header systemProvidedUI
     */
    openInCalendarAsync(params: CalendarDialogOpenParamsNext | null): void;
    /**
     * Launches the calendar UI provided by the OS to edit or delete an event.
     * @return A promise which resolves with information about the dialog result.
     * @header systemProvidedUI
     */
    editInCalendarAsync(params: CalendarDialogParamsNext | null): Promise<DialogEventResult>;
    /**
     * Returns an event instance for a given event (or instance of a recurring event).
     * @param recurringEventOptions A map of options for recurring events.
     * @return An event instance.
     */
    getOccurrence(recurringEventOptions?: RecurringEventOptions): ExpoCalendarEvent;
    /**
     * Gets all attendees for a given event (or instance of a recurring event).
     * @param recurringEventOptions A map of options for recurring events.
     * @return An array of [`Attendee`](#attendee) associated with the specified event.
     */
    getAttendees(recurringEventOptions?: RecurringEventOptions): ExpoCalendarAttendee[];
    /**
     * Updates the provided details of an existing calendar stored on the device. To remove a property,
     * explicitly set it to `null` in `details`.
     * @param details A map of properties to be updated.
     * @param recurringEventOptions A map of options for recurring events.
     */
    update(details: Partial<ModifiableEventProperties>, recurringEventOptions?: RecurringEventOptions, nullableFields?: (keyof ModifiableEventProperties)[]): void;
    /**
     * Deletes the event.
     * @param recurringEventOptions A map of options for recurring events.
     */
    delete(recurringEventOptions: RecurringEventOptions): void;
}
export declare class ExpoCalendarReminder {
    /**
     * Internal ID that represents this reminder on the device.
     */
    id?: string;
    /**
     * ID of the calendar that contains this reminder.
     */
    calendarId?: string;
    /**
     * Visible name of the reminder.
     */
    title?: string;
    /**
     * Location field of the reminder
     */
    location?: string;
    /**
     * Date when the reminder record was created.
     */
    creationDate?: string | Date;
    /**
     * Date when the reminder record was last modified.
     */
    lastModifiedDate?: string | Date;
    /**
     * Time zone the reminder is scheduled in.
     */
    timeZone?: string;
    /**
     * URL for the reminder.
     */
    url?: string;
    /**
     * Description or notes saved with the reminder.
     */
    notes?: string;
    /**
     * Array of Alarm objects which control automated alarms to the user about the task.
     */
    alarms?: Alarm[];
    /**
     * Object representing rules for recurring or repeated reminders. `null` for one-time tasks.
     */
    recurrenceRule?: RecurrenceRule | null;
    /**
     * Date object or string representing the start date of the reminder task.
     */
    startDate?: string | Date;
    /**
     * Date object or string representing the time when the reminder task is due.
     */
    dueDate?: string | Date;
    /**
     * Indicates whether or not the task has been completed.
     */
    completed?: boolean;
    /**
     * Date object or string representing the date of completion, if `completed` is `true`.
     * Setting this property of a nonnull `Date` will automatically set the reminder's `completed` value to `true`.
     */
    completionDate?: string | Date;
    update(details: Partial<ModifiableReminderProperties>, nullableFields?: (keyof ModifiableReminderProperties)[]): void;
    /**
     * Deletes the reminder.
     */
    delete(): void;
}
/**
 * Represents a calendar attendee object.
 */
export declare class ExpoCalendarAttendee {
    /**
     * Indicates whether or not this attendee is the current OS user.
     */
    isCurrentUser?: boolean;
    /**
     * Displayed name of the attendee.
     */
    name: string;
    /**
     * Role of the attendee at the event.
     */
    role: AttendeeRole;
    /**
     * Status of the attendee in relation to the event.
     */
    status: AttendeeStatus;
    /**
     * Type of the attendee.
     */
    type: AttendeeType;
    /**
     * URL for the attendee.
     */
    url?: string;
}
export {};
//# sourceMappingURL=ExpoCalendar.types.d.ts.map