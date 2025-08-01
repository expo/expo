import { ExpoCalendar, ExpoCalendarEvent } from './ExpoCalendar.types';

class ExpoGoCalendarNextStub {
  Calendar = ExpoCalendar;
  Event = ExpoCalendarEvent;

  getDefaultCalendar(): ExpoCalendar {
    throw new Error('Calendar functionality is not available in Expo Go');
  }

  getAllCalendars(entityType?: string): ExpoCalendar[] {
    throw new Error('Calendar functionality is not available in Expo Go');
  }
}

export default ExpoGoCalendarNextStub;
