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
} from '../Calendar';

export declare class CustomExpoCalendar {
  constructor(id: string);

  id: string;
  title: string;
  sourceId?: string;
  source: Source;
  type?: CalendarType;
  // TODO: Add color support
  color: string;
  entityType?: EntityTypes;
  allowsModifications: boolean;
  allowedAvailabilities: Availability[];

  /**
   * Lists the event ids of the calendar.
   */
  listEvents(startDate: Date | string, endDate: Date | string): CustomExpoCalendarEvent[];

  /**
   * Lists the reminders of the calendar.
   */
  listReminders(
    startDate: Date | string,
    endDate: Date | string,
    status?: ReminderStatus | null,
  ): Promise<CustomExpoCalendarReminder[]>;

  createEvent(eventData: Omit<Partial<Event>, 'id' | 'organizer'>): CustomExpoCalendarEvent;

  // TODO
  createReminder(details: Partial<Reminder>): CustomExpoCalendarReminder;

  update(details: Partial<Pick<Calendar, 'title' | 'color'>>): void;

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

  // TODO
  openInCalendar(): void;

  // TODO
  editInCalendar(): void;

  // TODO: Add support for recurring events options
  getAttendees(recurringEventOptions?: RecurringEventOptions): CustomExpoCalendarAttendee[];

  update(details: Partial<Event>, recurringEventOptions?: RecurringEventOptions): void;

  delete(recurringEventOptions?: RecurringEventOptions): void;
}

export declare class CustomExpoCalendarReminder {
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

  // TODO
  update(details: Partial<Reminder>): void;

  // TODO
  delete(): void;
}

export declare class CustomExpoCalendarAttendee {
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
