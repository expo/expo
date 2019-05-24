import { UnavailabilityError } from '@unimodules/core';
import { Platform, processColor } from 'react-native';

import ExpoCalendar from './ExpoCalendar';

type RecurringEventOptions = {
  futureEvents?: boolean;
  instanceStartDate?: string | Date;
}; // iOS

export interface Calendar {
  id?: string;
  title?: string;
  sourceId?: string; // iOS
  source?: Source;
  type?: string; // iOS
  color?: string;
  entityType?: string; // iOS
  allowsModifications?: boolean;
  allowedAvailabilities?: string[];
  isPrimary?: boolean; // Android
  name?: string; // Android
  ownerAccount?: string; // Android
  timeZone?: string; // Android
  allowedReminders?: string[]; // Android
  allowedAttendeeTypes?: string[]; // Android
  isVisible?: boolean; // Android
  isSynced?: boolean; // Android
  accessLevel?: string; // Android
};

type Source = {
  id?: string; // iOS only ??
  type?: string;
  name?: string;
  isLocalAccount?: boolean; // Android
};

export type Event = {
  id?: string;
  calendarId?: string;
  title?: string;
  location?: string;
  creationDate?: string | Date; // iOS
  lastModifiedDate?: string | Date; // iOS
  timeZone?: string;
  endTimeZone?: string; // Android
  url?: string; // iOS
  notes?: string;
  alarms?: Alarm[];
  recurrenceRule?: RecurrenceRule;
  startDate?: string | Date;
  endDate?: string | Date;
  originalStartDate?: string | Date; // iOS
  isDetached?: boolean; // iOS
  allDay?: boolean;
  availability?: string; // Availability
  status?: string; // Status
  organizer?: string; // Organizer - iOS
  organizerEmail?: string; // Android
  accessLevel?: string; // Android,
  guestsCanModify?: boolean; // Android,
  guestsCanInviteOthers?: boolean; // Android
  guestsCanSeeGuests?: boolean; // Android
  originalId?: string; // Android
  instanceId?: string; // Android
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

type Attendee = {
  id?: string; // Android
  isCurrentUser?: boolean; // iOS
  name?: string;
  role?: string;
  status?: string;
  type?: string;
  url?: string; // iOS
  email?: string; // Android
};

type Alarm = {
  absoluteDate?: string; // iOS
  relativeOffset?: string;
  structuredLocation?: {
    // iOS
    title?: string;
    proximity?: string; // Proximity
    radius?: number;
    coords?: {
      latitude?: number;
      longitude?: number;
    };
  };
  method?: string; // Method, Android
};

type RecurrenceRule = {
  frequency: string; // Frequency
  interval?: number;
  endDate?: string;
  occurrence?: number;
};

export async function getCalendarsAsync(entityType?: string): Promise<void> {
  if (!ExpoCalendar.getCalendarsAsync) {
    throw new UnavailabilityError('Calendar', 'getCalendarsAsync');
  }
  if (!entityType) {
    return ExpoCalendar.getCalendarsAsync(null);
  }
  return ExpoCalendar.getCalendarsAsync(entityType);
}

export async function createCalendarAsync(details: Calendar = {}): Promise<string> {
  if (!ExpoCalendar.saveCalendarAsync) {
    throw new UnavailabilityError('Calendar', 'createCalendarAsync');
  }
  let color = details.color ? processColor(details.color) : undefined;
  const newDetails = { ...details, id: undefined, color };
  return ExpoCalendar.saveCalendarAsync(newDetails);
}

export async function updateCalendarAsync(id: string, details: Calendar = {}): Promise<string> {
  if (!ExpoCalendar.saveCalendarAsync) {
    throw new UnavailabilityError('Calendar', 'updateCalendarAsync');
  }
  if (!id) {
    throw new Error(
      'updateCalendarAsync must be called with an id (string) of the target calendar'
    );
  }
  let color = details.color ? processColor(details.color) : undefined;

  if (Platform.OS === 'android') {
    if (
      details.hasOwnProperty('source') ||
      details.hasOwnProperty('color') ||
      details.hasOwnProperty('allowsModifications') ||
      details.hasOwnProperty('allowedAvailabilities') ||
      details.hasOwnProperty('isPrimary') ||
      details.hasOwnProperty('ownerAccount') ||
      details.hasOwnProperty('timeZone') ||
      details.hasOwnProperty('allowedReminders') ||
      details.hasOwnProperty('allowedAttendeeTypes') ||
      details.hasOwnProperty('accessLevel')
    ) {
      console.warn(
        'updateCalendarAsync was called with one or more read-only properties, which will not be updated'
      );
    }
  } else {
    if (
      details.hasOwnProperty('source') ||
      details.hasOwnProperty('type') ||
      details.hasOwnProperty('entityType') ||
      details.hasOwnProperty('allowsModifications') ||
      details.hasOwnProperty('allowedAvailabilities')
    ) {
      console.warn(
        'updateCalendarAsync was called with one or more read-only properties, which will not be updated'
      );
    }
  }

  const newDetails = { ...details, id, color };
  return ExpoCalendar.saveCalendarAsync(newDetails);
}

export async function deleteCalendarAsync(id: string): Promise<void> {
  if (!ExpoCalendar.deleteCalendarAsync) {
    throw new UnavailabilityError('Calendar', 'deleteCalendarAsync');
  }
  if (!id) {
    throw new Error(
      'deleteCalendarAsync must be called with an id (string) of the target calendar'
    );
  }
  return ExpoCalendar.deleteCalendarAsync(id);
}

export async function getEventsAsync(
  calendarIds: string[],
  startDate: Date,
  endDate: Date
): Promise<Event[]> {
  if (!ExpoCalendar.getEventsAsync) {
    throw new UnavailabilityError('Calendar', 'getEventsAsync');
  }
  if (!startDate) {
    throw new Error('getEventsAsync must be called with a startDate (date) to search for events');
  }
  if (!endDate) {
    throw new Error('getEventsAsync must be called with an endDate (date) to search for events');
  }
  if (!calendarIds || !calendarIds.length) {
    throw new Error(
      'getEventsAsync must be called with a non-empty array of calendarIds to search'
    );
  }
  return ExpoCalendar.getEventsAsync(
    stringifyIfDate(startDate),
    stringifyIfDate(endDate),
    calendarIds
  );
}

export async function getEventAsync(
  id: string,
  { futureEvents = false, instanceStartDate }: RecurringEventOptions = {}
): Promise<Event> {
  if (!ExpoCalendar.getEventByIdAsync) {
    throw new UnavailabilityError('Calendar', 'getEventAsync');
  }
  if (!id) {
    throw new Error('getEventAsync must be called with an id (string) of the target event');
  }
  if (Platform.OS === 'ios') {
    return ExpoCalendar.getEventByIdAsync(id, instanceStartDate);
  } else {
    return ExpoCalendar.getEventByIdAsync(id);
  }
}

export async function createEventAsync(calendarId: string, details: Event = {}): Promise<string> {
  if (!ExpoCalendar.saveEventAsync) {
    throw new UnavailabilityError('Calendar', 'createEventAsync');
  }
  if (!calendarId) {
    throw new Error('createEventAsync must be called with an id (string) of the target calendar');
  }

  if (Platform.OS === 'android') {
    if (!details.startDate) {
      throw new Error('createEventAsync requires a startDate (Date)');
    }
    if (!details.endDate) {
      throw new Error('createEventAsync requires an endDate (Date)');
    }
  }

  const newDetails = {
    ...details,
    id: undefined,
    calendarId: calendarId === DEFAULT ? undefined : calendarId,
  };
  return ExpoCalendar.saveEventAsync(stringifyDateValues(newDetails), {});
}

export async function updateEventAsync(
  id: string,
  details: Event = {},
  { futureEvents = false, instanceStartDate }: RecurringEventOptions = {}
): Promise<string> {
  if (!ExpoCalendar.saveEventAsync) {
    throw new UnavailabilityError('Calendar', 'updateEventAsync');
  }
  if (!id) {
    throw new Error('updateEventAsync must be called with an id (string) of the target event');
  }

  if (Platform.OS === 'ios') {
    if (
      details.hasOwnProperty('creationDate') ||
      details.hasOwnProperty('lastModifiedDate') ||
      details.hasOwnProperty('originalStartDate') ||
      details.hasOwnProperty('isDetached') ||
      details.hasOwnProperty('status') ||
      details.hasOwnProperty('organizer')
    ) {
      console.warn(
        'updateEventAsync was called with one or more read-only properties, which will not be updated'
      );
    }
  }

  const newDetails = { ...details, id, instanceStartDate };
  return ExpoCalendar.saveEventAsync(stringifyDateValues(newDetails), { futureEvents });
}

export async function deleteEventAsync(
  id: string,
  { futureEvents = false, instanceStartDate }: RecurringEventOptions = {}
): Promise<void> {
  if (!ExpoCalendar.deleteEventAsync) {
    throw new UnavailabilityError('Calendar', 'deleteEventAsync');
  }
  if (!id) {
    throw new Error('deleteEventAsync must be called with an id (string) of the target event');
  }
  return ExpoCalendar.deleteEventAsync({ id, instanceStartDate }, { futureEvents });
}

export async function getAttendeesForEventAsync(
  id: string,
  { futureEvents = false, instanceStartDate }: RecurringEventOptions = {}
): Promise<Attendee[]> {
  if (!ExpoCalendar.getAttendeesForEventAsync) {
    throw new UnavailabilityError('Calendar', 'getAttendeesForEventAsync');
  }
  if (!id) {
    throw new Error(
      'getAttendeesForEventAsync must be called with an id (string) of the target event'
    );
  }
  // Android only takes an ID, iOS takes an object
  const params = Platform.OS === 'ios' ? { id, instanceStartDate } : id;
  return ExpoCalendar.getAttendeesForEventAsync(params);
}

export async function createAttendeeAsync(
  eventId: string,
  details: Attendee = {}
): Promise<string> {
  if (!ExpoCalendar.saveAttendeeForEventAsync) {
    throw new UnavailabilityError('Calendar', 'createAttendeeAsync');
  }
  if (!eventId) {
    throw new Error('createAttendeeAsync must be called with an id (string) of the target event');
  }
  if (!details.email) {
    throw new Error('createAttendeeAsync requires an email (string)');
  }
  if (!details.role) {
    throw new Error('createAttendeeAsync requires a role (string)');
  }
  if (!details.type) {
    throw new Error('createAttendeeAsync requires a type (string)');
  }
  if (!details.status) {
    throw new Error('createAttendeeAsync requires a status (string)');
  }
  const newDetails = { ...details, id: undefined };
  return ExpoCalendar.saveAttendeeForEventAsync(newDetails, eventId);
} // Android

export async function updateAttendeeAsync(id: string, details: Attendee = {}): Promise<string> {
  if (!ExpoCalendar.saveAttendeeForEventAsync) {
    throw new UnavailabilityError('Calendar', 'updateAttendeeAsync');
  }
  if (!id) {
    throw new Error('updateAttendeeAsync must be called with an id (string) of the target event');
  }
  const newDetails = { ...details, id };
  return ExpoCalendar.saveAttendeeForEventAsync(newDetails, null);
} // Android

export async function deleteAttendeeAsync(id: string): Promise<void> {
  if (!ExpoCalendar.deleteAttendeeAsync) {
    throw new UnavailabilityError('Calendar', 'deleteAttendeeAsync');
  }
  if (!id) {
    throw new Error('deleteAttendeeAsync must be called with an id (string) of the target event');
  }
  return ExpoCalendar.deleteAttendeeAsync(id);
} // Android

export async function getRemindersAsync(
  calendarIds: string[],
  status: string | null,
  startDate: Date,
  endDate: Date
): Promise<Reminder[]> {
  if (!ExpoCalendar.getRemindersAsync) {
    throw new UnavailabilityError('Calendar', 'getRemindersAsync');
  }
  if (status && !startDate) {
    throw new Error(
      'getRemindersAsync must be called with a startDate (date) to search for reminders'
    );
  }
  if (status && !endDate) {
    throw new Error(
      'getRemindersAsync must be called with an endDate (date) to search for reminders'
    );
  }
  if (!calendarIds || !calendarIds.length) {
    throw new Error(
      'getRemindersAsync must be called with a non-empty array of calendarIds to search'
    );
  }
  return ExpoCalendar.getRemindersAsync(
    stringifyIfDate(startDate) || null,
    stringifyIfDate(endDate) || null,
    calendarIds,
    status || null
  );
} // iOS

export async function getReminderAsync(id: string): Promise<Reminder> {
  if (!ExpoCalendar.getReminderByIdAsync) {
    throw new UnavailabilityError('Calendar', 'getReminderAsync');
  }
  if (!id) {
    throw new Error('getReminderAsync must be called with an id (string) of the target reminder');
  }
  return ExpoCalendar.getReminderByIdAsync(id);
} // iOS

export async function createReminderAsync(
  calendarId: string,
  details: Reminder = {}
): Promise<string> {
  if (!ExpoCalendar.saveReminderAsync) {
    throw new UnavailabilityError('Calendar', 'createReminderAsync');
  }
  if (!calendarId) {
    throw new Error(
      'createReminderAsync must be called with an id (string) of the target calendar'
    );
  }
  const newDetails = {
    ...details,
    id: undefined,
    calendarId: calendarId === DEFAULT ? undefined : calendarId,
  };
  return ExpoCalendar.saveReminderAsync(stringifyDateValues(newDetails));
} // iOS

export async function updateReminderAsync(id: string, details: Reminder = {}): Promise<string> {
  if (!ExpoCalendar.saveReminderAsync) {
    throw new UnavailabilityError('Calendar', 'updateReminderAsync');
  }
  if (!id) {
    throw new Error(
      'updateReminderAsync must be called with an id (string) of the target reminder'
    );
  }

  if (details.hasOwnProperty('creationDate') || details.hasOwnProperty('lastModifiedDate')) {
    console.warn(
      'updateReminderAsync was called with one or more read-only properties, which will not be updated'
    );
  }

  const newDetails = { ...details, id };
  return ExpoCalendar.saveReminderAsync(stringifyDateValues(newDetails));
} // iOS

export async function deleteReminderAsync(id: string): Promise<void> {
  if (!ExpoCalendar.deleteReminderAsync) {
    throw new UnavailabilityError('Calendar', 'deleteReminderAsync');
  }
  if (!id) {
    throw new Error(
      'deleteReminderAsync must be called with an id (string) of the target reminder'
    );
  }
  return ExpoCalendar.deleteReminderAsync(id);
} // iOS

export async function getSourcesAsync(): Promise<Source[]> {
  if (!ExpoCalendar.getSourcesAsync) {
    throw new UnavailabilityError('Calendar', 'getSourcesAsync');
  }
  return ExpoCalendar.getSourcesAsync();
} // iOS

export async function getSourceAsync(id: string): Promise<Source> {
  if (!ExpoCalendar.getSourceByIdAsync) {
    throw new UnavailabilityError('Calendar', 'getSourceAsync');
  }
  if (!id) {
    throw new Error('getSourceAsync must be called with an id (string) of the target source');
  }
  return ExpoCalendar.getSourceByIdAsync(id);
} // iOS

export function openEventInCalendar(id: string): void {
  if (!ExpoCalendar.openEventInCalendar) {
    console.warn(`openEventInCalendar is not available on platform: ${Platform.OS}`);
    return;
  }
  if (!id) {
    throw new Error('openEventInCalendar must be called with an id (string) of the target event');
  }
  return ExpoCalendar.openEventInCalendar(parseInt(id, 10));
} // Android

export async function requestPermissionsAsync(): Promise<void> {
  if (!ExpoCalendar.requestPermissionsAsync) {
    throw new UnavailabilityError('Calendar', 'requestPermissionsAsync');
  }
  return await ExpoCalendar.requestPermissionsAsync();
}

export async function requestRemindersPermissionsAsync(): Promise<void> {
  if (!ExpoCalendar.requestRemindersPermissionsAsync) {
    throw new UnavailabilityError('Calendar', 'requestRemindersPermissionsAsync');
  }
  return await ExpoCalendar.requestRemindersPermissionsAsync();
}

export const EntityTypes = {
  EVENT: 'event',
  REMINDER: 'reminder',
};

export const Frequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

export const Availability = {
  NOT_SUPPORTED: 'notSupported', // iOS
  BUSY: 'busy',
  FREE: 'free',
  TENTATIVE: 'tentative',
  UNAVAILABLE: 'unavailable', // iOS
};

export const CalendarType = {
  LOCAL: 'local',
  CALDAV: 'caldav',
  EXCHANGE: 'exchange',
  SUBSCRIBED: 'subscribed',
  BIRTHDAYS: 'birthdays',
}; // iOS

export const EventStatus = {
  NONE: 'none',
  CONFIRMED: 'confirmed',
  TENTATIVE: 'tentative',
  CANCELED: 'canceled',
};

export const SourceType = {
  LOCAL: 'local',
  EXCHANGE: 'exchange',
  CALDAV: 'caldav',
  MOBILEME: 'mobileme',
  SUBSCRIBED: 'subscribed',
  BIRTHDAYS: 'birthdays',
};

export const AttendeeRole = {
  UNKNOWN: 'unknown', // iOS
  REQUIRED: 'required', // iOS
  OPTIONAL: 'optional', // iOS
  CHAIR: 'chair', // iOS
  NON_PARTICIPANT: 'nonParticipant', // iOS
  ATTENDEE: 'attendee', // Android
  ORGANIZER: 'organizer', // Android
  PERFORMER: 'performer', // Android
  SPEAKER: 'speaker', // Android
  NONE: 'none', // Android
};

export const AttendeeStatus = {
  UNKNOWN: 'unknown', // iOS
  PENDING: 'pending', // iOS
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  TENTATIVE: 'tentative',
  DELEGATED: 'delegated', // iOS
  COMPLETED: 'completed', // iOS
  IN_PROCESS: 'inProcess', // iOS
  INVITED: 'invited', // Android
  NONE: 'none', // Android
};

export const AttendeeType = {
  UNKNOWN: 'unknown', // iOS
  PERSON: 'person', // iOS
  ROOM: 'room', // iOS
  GROUP: 'group', // iOS
  RESOURCE: 'resource',
  OPTIONAL: 'optional', // Android
  REQUIRED: 'required', // Android
  NONE: 'none', // Android
};

export const AlarmMethod = {
  ALARM: 'alarm',
  ALERT: 'alert',
  EMAIL: 'email',
  SMS: 'sms',
  DEFAULT: 'default',
};

export const EventAccessLevel = {
  CONFIDENTIAL: 'confidential',
  PRIVATE: 'private',
  PUBLIC: 'public',
  DEFAULT: 'default',
};

export const CalendarAccessLevel = {
  CONTRIBUTOR: 'contributor',
  EDITOR: 'editor',
  FREEBUSY: 'freebusy',
  OVERRIDE: 'override',
  OWNER: 'owner',
  READ: 'read',
  RESPOND: 'respond',
  ROOT: 'root',
  NONE: 'none',
};

export const ReminderStatus = {
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
};

export const DEFAULT = 'default';

function stringifyIfDate(date: any): any {
  return date instanceof Date ? date.toISOString() : date;
}

function stringifyDateValues(obj: object): object {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = stringifyIfDate(obj[key]);
    return acc;
  }, {});
}
