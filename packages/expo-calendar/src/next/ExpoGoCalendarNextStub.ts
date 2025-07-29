import { CustomExpoCalendar, CustomExpoCalendarEvent } from './ExpoCalendar.types';

class ExpoGoCalendarNextStub {
  Calendar = CustomExpoCalendar;
  Event = CustomExpoCalendarEvent;

  getDefaultCalendar(): CustomExpoCalendar {
    throw new Error('Calendar functionality is not available in Expo Go');
  }

  getAllCalendars(entityType?: string): CustomExpoCalendar[] {
    throw new Error('Calendar functionality is not available in Expo Go');
  }
}

export default ExpoGoCalendarNextStub;
