import { UnavailabilityError } from 'expo-modules-core';
import { processColor } from 'react-native';

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

export class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent {}

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

export function createCalendarNext(details: Partial<Calendar> = {}): ExportExpoCalendar {
  if (!ExpoCalendar.createCalendarNext) {
    throw new UnavailabilityError('Calendar', 'createCalendarNext');
  }
  const color = details.color ? processColor(details.color) : undefined;
  const newDetails = { ...details, id: undefined, color };
  const createdCalendar = ExpoCalendar.createCalendarNext(newDetails);
  Object.setPrototypeOf(createdCalendar, ExportExpoCalendar.prototype);
  return createdCalendar;
}
