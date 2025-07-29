import {
  EntityTypes,
  Event,
  RecurringEventOptions,
  stringifyDateValues,
  stringifyIfDate,
} from '../Calendar';
import ExpoCalendar from './ExpoCalendar';

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
    const result = this.listEventsAsIds(stringifyIfDate(startDate), stringifyIfDate(endDate));
    return result.map((id) => new ExportExpoCalendarEvent(id));
  }
}

export const getDefaultCalendarNext = () =>
  new ExportExpoCalendar(ExpoCalendar.getDefaultCalendarId());

export const getCalendarsNext = (type?: EntityTypes) =>
  ExpoCalendar.getCalendarsIds(type).map((id) => new ExportExpoCalendar(id));
