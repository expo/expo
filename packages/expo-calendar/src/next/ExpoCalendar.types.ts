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

export declare class ExpoCalendar {
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
   * Lists the event ids of the calendar.
   */
  listEvents(startDate: Date | string, endDate: Date | string): ExpoCalendarEvent[];

  /**
   * Lists the reminders of the calendar.
   */
  listReminders(
    startDate: Date | string,
    endDate: Date | string,
    status?: ReminderStatus | null
  ): Promise<ExpoCalendarReminder[]>;

  createEvent(eventData: Omit<Partial<Event>, 'id' | 'organizer'>): ExpoCalendarEvent;

  createReminder(details: Omit<Partial<Reminder>, 'id' | 'calendarId'>): ExpoCalendarReminder;

  update(details: Partial<Pick<Calendar, 'title' | 'color'>>): void;

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

  openInCalendarAsync(
    params: CalendarDialogOpenParamsNext | null // TODO: Support skipping this param instead of passing null, change needed in the core
  ): void;

  editInCalendarAsync(
    params: CalendarDialogParamsNext | null // TODO: Support skipping this param instead of passing null, change needed in the core
  ): Promise<DialogEventResult>;

  getAttendees(recurringEventOptions?: RecurringEventOptions): ExpoCalendarAttendee[];

  update(details: Partial<Event>, recurringEventOptions?: RecurringEventOptions): void;

  delete(recurringEventOptions: RecurringEventOptions): void; // TODO: Support skipping this param instead of passing null, change needed in the core
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
  notes?: string;
  alarms?: Alarm[];
  recurrenceRule?: RecurrenceRule | null;
  startDate?: string | Date;
  dueDate?: string | Date;
  completed?: boolean;
  completionDate?: string | Date;

  // TODO: Add support for dates
  update(
    details: Omit<
      Partial<Reminder>,
      'id' | 'calendarId' | 'startDate' | 'dueDate' | 'completionDate'
    >
  ): void;

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

  // TODO
  update(details: Partial<Attendee>): void;

  // TODO
  delete(): void;
}
