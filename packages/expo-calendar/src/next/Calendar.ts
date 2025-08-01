import { UnavailabilityError } from 'expo-modules-core';
import { Platform, processColor } from 'react-native';

import {
  Calendar,
  EntityTypes,
  Event,
  Reminder,
  ReminderStatus,
  stringifyDateValues,
  stringifyIfDate,
} from '../Calendar';
import InternalExpoCalendar from './ExpoCalendar';

export class ExpoCalendarAttendee extends InternalExpoCalendar.ExpoCalendarAttendee {}

export class ExpoCalendarEvent extends InternalExpoCalendar.ExpoCalendarEvent {}

export class ExpoCalendarReminder extends InternalExpoCalendar.ExpoCalendarReminder {}

export class ExpoCalendar extends InternalExpoCalendar.ExpoCalendar {
  override createEvent(details: Partial<Event>): ExpoCalendarEvent {
    return super.createEvent(stringifyDateValues(details));
  }

  override createReminder(details: Partial<Reminder>): ExpoCalendarReminder {
    return super.createReminder(stringifyDateValues(details));
  }

  override listEvents(startDate: Date, endDate: Date): ExpoCalendarEvent[] {
    if (!startDate) {
      throw new Error('listEvents must be called with a startDate (date) to search for events');
    }
    if (!endDate) {
      throw new Error('listEvents must be called with an endDate (date) to search for events');
    }
    return super.listEvents(stringifyIfDate(startDate), stringifyIfDate(endDate));
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
    return super.listReminders(
      stringifyIfDate(startDate),
      stringifyIfDate(endDate),
      status || null
    );
  }

  override update(details: Partial<Calendar>): void {
    const color = details.color ? processColor(details.color)?.toString() : undefined;

    if (Platform.OS === 'android') {
      // TODO: Implement
      throw new Error('Not implemented yet');
    } else {
      if (
        details.hasOwnProperty('source') ||
        details.hasOwnProperty('type') ||
        details.hasOwnProperty('entityType') ||
        details.hasOwnProperty('allowsModifications') ||
        details.hasOwnProperty('allowedAvailabilities')
      ) {
        console.warn(
          'ExpoCalendar.update was called with one or more read-only properties, which will not be updated'
        );
      }
    }

    const newDetails = { ...details, color };
    super.update(newDetails);
  }
}

export function getDefaultCalendarNext(): ExpoCalendar {
  if (!InternalExpoCalendar.getDefaultCalendarId) {
    throw new UnavailabilityError('Calendar', 'getDefaultCalendarId');
  }
  return new ExpoCalendar(InternalExpoCalendar.getDefaultCalendarId());
}

export function getCalendarsNext(type?: EntityTypes): ExpoCalendar[] {
  if (!InternalExpoCalendar.getCalendarsIds) {
    throw new UnavailabilityError('Calendar', 'getCalendarsIds');
  }
  return InternalExpoCalendar.getCalendarsIds(type).map((id) => new ExpoCalendar(id));
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

export const requestCalendarPermissionsAsync = InternalExpoCalendar.requestCalendarPermissionsAsync;
export const getCalendarPermissionsAsync = InternalExpoCalendar.getCalendarPermissionsAsync;
export const requestRemindersPermissionsAsync = InternalExpoCalendar.requestRemindersPermissionsAsync;
export const getRemindersPermissionsAsync = InternalExpoCalendar.getRemindersPermissionsAsync;
export const getSources = InternalExpoCalendar.getSources;
