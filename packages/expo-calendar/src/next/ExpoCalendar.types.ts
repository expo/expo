import {
  AttendeeRole,
  AttendeeStatus,
  AttendeeType,
  Source,
  Event,
  RecurringEventOptions,
  CalendarType,
  Availability,
  EntityTypes,
  Alarm,
  RecurrenceRule,
  EventStatus,
  Organizer,
  ReminderStatus,
  Calendar,
  Reminder,
  Attendee,
  CalendarDialogParams,
  DialogEventResult,
  OpenEventPresentationOptions,
  PresentationOptions,
  EventAccessLevel,
  CalendarAccessLevel,
  AlarmMethod,
} from '../Calendar';

type CalendarDialogParamsNext = Omit<CalendarDialogParams, 'id'> & PresentationOptions;

type CalendarDialogOpenParamsNext = CalendarDialogParamsNext & OpenEventPresentationOptions;

export type ModifableCalendarProperties = Pick<Calendar, 'color' | 'title'>;

export type ModifiableEventProperties = Pick<
  Event,
  | 'title'
  | 'location'
  | 'timeZone'
  | 'url'
  | 'notes'
  | 'alarms'
  | 'recurrenceRule'
  | 'availability'
  | 'startDate'
  | 'endDate'
  | 'allDay'
>;

export type ModifableReminderProperties = Pick<
  Reminder,
  | 'title'
  | 'location'
  | 'timeZone'
  | 'url'
  | 'notes'
  | 'alarms'
  | 'recurrenceRule'
  | 'startDate'
  | 'dueDate'
  | 'completed'
  | 'completionDate'
>;

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
   * @platform ios
   */
  sourceId?: string;
  /**
   * Object representing the source to be used for the calendar.
   */
  source: Source;
  /**
   * Type of calendar this object represents.
   * @platform ios
   */
  type?: CalendarType;
  /**
   * Color used to display this calendar's events.
   */
  color: string;
  /**
   * Whether the calendar is used in the Calendar or Reminders OS app.
   * @platform ios
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
   * Boolean value indicating whether this is the device's primary calendar.
   * @platform android
   */
  isPrimary?: boolean;
  /**
   * Internal system name of the calendar.
   * @platform android
   */
  name?: string | null;
  /**
   * Name for the account that owns this calendar.
   * @platform android
   */
  ownerAccount?: string;
  /**
   * Time zone for the calendar.
   * @platform android
   */
  timeZone?: string;
  /**
   * Alarm methods that this calendar supports.
   * @platform android
   */
  allowedReminders?: AlarmMethod[];
  /**
   * Attendee types that this calendar supports.
   * @platform android
   */
  allowedAttendeeTypes?: AttendeeType[];
  /**
   * Indicates whether the OS displays events on this calendar.
   * @platform android
   */
  isVisible?: boolean;
  /**
   * Indicates whether this calendar is synced and its events stored on the device.
   * Unexpected behavior may occur if this is not set to `true`.
   * @platform android
   */
  isSynced?: boolean;
  /**
   * Level of access that the user has for the calendar.
   * @platform android
   */
  accessLevel?: CalendarAccessLevel;

  /**
   * Returns a calendar event list for the given date range.
   */
  listEvents(startDate: Date | string, endDate: Date | string): ExpoCalendarEvent[];

  /**
   * Returns a list of reminders matching the provided criteria. If `startDate` and `endDate` are defined,
   * returns all reminders that overlap at all with the [startDate, endDate] interval - i.e. all reminders
   * that end after the `startDate` or begin before the `endDate`.
   * @param startDate Beginning of time period to search for reminders in. Required if `status` is defined.
   * @param endDate End of time period to search for reminders in. Required if `status` is defined.
   * @param status One of `Calendar.ReminderStatus.COMPLETED` or `Calendar.ReminderStatus.INCOMPLETE`.
   * @return An array of [`Reminder`](#reminder) objects matching the search criteria.
   * @platform ios
   */
  listReminders(
    startDate?: Date | string | null,
    endDate?: Date | string | null,
    status?: ReminderStatus | null
  ): Promise<ExpoCalendarReminder[]>;

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
   * @platform ios
   */
  createReminder(reminderData: Omit<Partial<Reminder>, 'id' | 'calendarId'>): ExpoCalendarReminder;

  /**
   * Updates the provided details of an existing calendar stored on the device. To remove a property,
   * explicitly set it to `null` in `details`.
   * @param details A map of properties to be updated.
   */
  update(details: Partial<ModifableCalendarProperties>): void;

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
   * @platform ios
   */
  creationDate?: string | Date;
  /**
   * Date when the event record was last modified.
   * @platform ios
   */
  lastModifiedDate?: string | Date;
  /**
   * Time zone the event is scheduled in.
   */
  timeZone: string;
  /**
   * Time zone for the event end time.
   * @platform android
   */
  endTimeZone?: string;
  /**
   * URL for the event.
   * @platform ios
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
   * @platform ios
   */
  originalStartDate?: string | Date;
  /**
   * Boolean value indicating whether or not the event is a detached (modified) instance of a recurring event.
   * @platform ios
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
   * This property is only available on events associated with calendars that are managed by a service ie. Google Calendar or iCloud.
   * The organizer is read-only and cannot be set.
   *
   * @platform ios
   */
  organizer?: Organizer;
  /**
   * Email address of the organizer of the event.
   * @platform android
   */
  organizerEmail?: string;
  /**
   * User's access level for the event.
   * @platform android
   */
  accessLevel?: EventAccessLevel;
  /**
   * Whether invited guests can modify the details of the event.
   * @platform android
   */
  guestsCanModify?: boolean;
  /**
   * Whether invited guests can invite other guests.
   * @platform android
   */
  guestsCanInviteOthers?: boolean;
  /**
   * Whether invited guests can see other guests.
   * @platform android
   */
  guestsCanSeeGuests?: boolean;
  /**
   * For detached (modified) instances of recurring events, the ID of the original recurring event.
   * @platform android
   */
  originalId?: string;
  /**
   * For instances of recurring events, volatile ID representing this instance. Not guaranteed to
   * always refer to the same instance.
   * @platform android
   */
  instanceId?: string;

  /**
   * Launches the calendar UI provided by the OS to preview an event.
   * @return A promise which resolves with information about the dialog result.
   * @header systemProvidedUI
   */
  openInCalendarAsync(
    params: CalendarDialogOpenParamsNext | null // TODO: Support skipping this param instead of passing null, change needed in the core
  ): void;

  /**
   * Launches the calendar UI provided by the OS to edit or delete an event.
   * @return A promise which resolves with information about the dialog result.
   * @header systemProvidedUI
   */
  editInCalendarAsync(
    params: CalendarDialogParamsNext | null // TODO: Support skipping this param instead of passing null, change needed in the core
  ): Promise<DialogEventResult>;

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
  update(
    details: Partial<ModifiableEventProperties>,
    recurringEventOptions?: RecurringEventOptions,
    nullableFields?: (keyof ModifiableEventProperties)[]
  ): void;

  /**
   * Deletes the event.
   * @param recurringEventOptions A map of options for recurring events.
   */
  delete(recurringEventOptions: RecurringEventOptions): void;
}

export declare class ExpoCalendarReminder {
  id?: string;
  calendarId?: string;
  title?: string;
  location?: string;
  creationDate?: string | Date;
  lastModifiedDate?: string | Date;
  timeZone?: string;
  url?: string;
  /**
   * Description or notes saved with the reminder.
   */
  notes: string;
  alarms?: Alarm[];
  recurrenceRule?: RecurrenceRule | null;
  startDate?: string | Date;
  dueDate?: string | Date;
  completed?: boolean;
  completionDate?: string | Date;

  update(
    details: Partial<ModifableReminderProperties>,
    nullableFields?: (keyof ModifableReminderProperties)[]
  ): void;

  /**
   * Creates an attendee.
   * @platform android
   */
  createAttendee(attendee: Omit<Attendee, 'id'>): ExpoCalendarAttendee;

  /**
   * Deletes the reminder.
   */
  delete(): void;
}

export declare class ExpoCalendarAttendee {
  id?: string;
  name: string;
  isCurrentUser: boolean;
  role: AttendeeRole;
  status: AttendeeStatus;
  type: AttendeeType;
  url?: string;
  email?: string;
}
