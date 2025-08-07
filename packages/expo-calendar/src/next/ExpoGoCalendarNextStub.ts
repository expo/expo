import type { ExpoCalendar } from './ExpoCalendar.types';

class ExpoGoCalendarNextStub {
  getDefaultCalendar(): ExpoCalendar {
    throw new Error('Calendar functionality is not available in Expo Go');
  }

  getAllCalendars(entityType?: string): ExpoCalendar[] {
    throw new Error('Calendar functionality is not available in Expo Go');
  }
}

export default ExpoGoCalendarNextStub;
