import { UnavailabilityError } from 'expo-modules-core';

import {
  Calendar,
  EntityTypes,
  Event,
  RecurringEventOptions,
  stringifyDateValues,
  stringifyIfDate,
} from '../Calendar';
import ExpoCalendar from './ExpoCalendar';

export class ExportExpoCalendarAttendee extends ExpoCalendar.CustomExpoCalendarAttendee {}

export class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent { }

export class ExportExpoCalendar extends ExpoCalendar.CustomExpoCalendar {
  override createEvent(
    details: Partial<Event>,
    options: RecurringEventOptions
  ): ExportExpoCalendarEvent {
    return super.createEvent(stringifyDateValues(details), options);
  }

  override listEvents(startDate: Date, endDate: Date): ExportExpoCalendarEvent[] {
    if (!startDate) {
      throw new Error('listEvents must be called with a startDate (date) to search for events');
    }
    if (!endDate) {
      throw new Error('listEvents must be called with an endDate (date) to search for events');
    }
    return super.listEvents(stringifyIfDate(startDate), stringifyIfDate(endDate));
  }
}

export function getDefaultCalendarNext(): ExportExpoCalendar {
  if (!ExpoCalendar.getDefaultCalendarId) {
    throw new UnavailabilityError('Calendar', 'getDefaultCalendarId');
  }
  return new ExportExpoCalendar(ExpoCalendar.getDefaultCalendarId());
}

export function getCalendarsNext(type?: EntityTypes): ExportExpoCalendar[] {
  if (!ExpoCalendar.getCalendarsIds) {
    throw new UnavailabilityError('Calendar', 'getCalendarsIds');
  }
  return ExpoCalendar.getCalendarsIds(type).map((id) => new ExportExpoCalendar(id));
}

export function createCalendar(details: Partial<Calendar> = {}): string {
  if (!ExpoCalendar.createCalendar) {
    throw new UnavailabilityError('Calendar', 'createCalendar');
  }
  // TODO: Implement it
  throw new UnavailabilityError('Calendar', 'createCalendar');
}
