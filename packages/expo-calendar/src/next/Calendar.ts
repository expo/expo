import { UnavailabilityError } from 'expo-modules-core';
import { Platform, processColor } from 'react-native';

import {
  Calendar,
  EntityTypes,
  Event,
  RecurringEventOptions,
  Reminder,
  ReminderStatus,
} from '../Calendar';
import InternalExpoCalendar from './ExpoCalendar';
import { stringifyDateValues, stringifyIfDate, getNullableDetailsFields } from '../utils';
import {
  ModifiableEventProperties,
  ModifableReminderProperties,
  ModifableCalendarProperties,
} from './ExpoCalendar.types';

export class ExpoCalendarAttendee extends InternalExpoCalendar.ExpoCalendarAttendee {}

export class ExpoCalendarEvent extends InternalExpoCalendar.ExpoCalendarEvent {
  override getOccurrence(recurringEventOptions: RecurringEventOptions = {}): ExpoCalendarEvent {
    return super.getOccurrence(stringifyDateValues(recurringEventOptions));
  }

  override getAttendees(recurringEventOptions: RecurringEventOptions = {}): ExpoCalendarAttendee[] {
    return super.getAttendees(stringifyDateValues(recurringEventOptions));
  }

  override update(
    details: Partial<ModifiableEventProperties>,
    options: RecurringEventOptions = {}
  ): void {
    const nullableDetailsFields = getNullableDetailsFields(details);
    super.update(stringifyDateValues(details), stringifyDateValues(options), nullableDetailsFields);
  }

  override delete(options: RecurringEventOptions = {}): void {
    super.delete(stringifyDateValues(options));
  }
}

export class ExpoCalendarReminder extends InternalExpoCalendar.ExpoCalendarReminder {
  override update(details: Partial<ModifableReminderProperties>): void {
    const nullableDetailsFields = getNullableDetailsFields(details);
    super.update(stringifyDateValues(details), nullableDetailsFields);
  }
}

export class ExpoCalendar extends InternalExpoCalendar.ExpoCalendar {
  override createEvent(details: Partial<Event>): ExpoCalendarEvent {
    const newEvent = super.createEvent(stringifyDateValues(details));
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
    Object.setPrototypeOf(newEvent, ExpoCalendarEvent.prototype);
    return newEvent;
  }

  override createReminder(details: Partial<Reminder>): ExpoCalendarReminder {
    const newReminder = super.createReminder(stringifyDateValues(details));
    Object.setPrototypeOf(newReminder, ExpoCalendarReminder.prototype);
    return newReminder;
  }

  override listEvents(startDate: Date, endDate: Date): ExpoCalendarEvent[] {
    if (!startDate) {
      throw new Error('listEvents must be called with a startDate (date) to search for events');
    }
    if (!endDate) {
      throw new Error('listEvents must be called with an endDate (date) to search for events');
    }
    return super.listEvents(stringifyIfDate(startDate), stringifyIfDate(endDate)).map((event) => {
      Object.setPrototypeOf(event, ExpoCalendarEvent.prototype);
      return event;
    });
  }

  override async listReminders(
    startDate: Date,
    endDate: Date,
    status?: ReminderStatus | null
  ): Promise<ExpoCalendarReminder[]> {
    if (!startDate) {
      throw new Error(
        'listReminders must be called with a startDate (date) to search for reminders'
      );
    }
    if (!endDate) {
      throw new Error(
        'listReminders must be called with an endDate (date) to search for reminders'
      );
    }
    const reminders = await super.listReminders(
      stringifyIfDate(startDate),
      stringifyIfDate(endDate),
      status || null
    );
    return reminders.map((reminder) => {
      Object.setPrototypeOf(reminder, ExpoCalendarReminder.prototype);
      return reminder;
    });
  }

  override update(details: Partial<ModifableCalendarProperties>): void {
    const color = details.color ? processColor(details.color) : undefined;
    const newDetails = { ...details, color: color || undefined };
    super.update(newDetails);
  }
}

export function getDefaultCalendarNext(): ExpoCalendar {
  if (!InternalExpoCalendar.getDefaultCalendar) {
    throw new UnavailabilityError('Calendar', 'getDefaultCalendar');
  }
  const defaultCalendar = InternalExpoCalendar.getDefaultCalendar();
  Object.setPrototypeOf(defaultCalendar, ExpoCalendar.prototype);
  return defaultCalendar;
}

export function getCalendarsNext(type?: EntityTypes): ExpoCalendar[] {
  if (!InternalExpoCalendar.getCalendars) {
    throw new UnavailabilityError('Calendar', 'getCalendars');
  }
  const calendars = InternalExpoCalendar.getCalendars(type);
  return calendars.map((calendar) => {
    Object.setPrototypeOf(calendar, ExpoCalendar.prototype);
    return calendar;
  });
}

export function createCalendarNext(details: Partial<Calendar> = {}): ExpoCalendar {
  if (!InternalExpoCalendar.createCalendarNext) {
    throw new UnavailabilityError('Calendar', 'createCalendarNext');
  }
  const color = details.color ? processColor(details.color) : undefined;
  const newDetails = { ...details, id: undefined, color: color || undefined };
  const createdCalendar = InternalExpoCalendar.createCalendarNext(newDetails);
  Object.setPrototypeOf(createdCalendar, ExpoCalendar.prototype);
  return createdCalendar;
}

export function listEvents(
  calendarIds: string[],
  startDate: Date,
  endDate: Date
): ExpoCalendarEvent[] {
  if (!InternalExpoCalendar.listEvents) {
    throw new UnavailabilityError('Calendar', 'listEvents');
  }
  return InternalExpoCalendar.listEvents(
    calendarIds,
    stringifyIfDate(startDate),
    stringifyIfDate(endDate)
  );
}

export const requestCalendarPermissionsAsync = InternalExpoCalendar.requestCalendarPermissionsAsync;
export const getCalendarPermissionsAsync = InternalExpoCalendar.getCalendarPermissionsAsync;
export const requestRemindersPermissionsAsync =
  InternalExpoCalendar.requestRemindersPermissionsAsync;
export const getRemindersPermissionsAsync = InternalExpoCalendar.getRemindersPermissionsAsync;

export const getSources = InternalExpoCalendar.getSources;
