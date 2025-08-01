import { ExpoCalendar, ExpoCalendarEvent } from './ExpoCalendar.types';
class ExpoGoCalendarNextStub {
    Calendar = ExpoCalendar;
    Event = ExpoCalendarEvent;
    getDefaultCalendar() {
        throw new Error('Calendar functionality is not available in Expo Go');
    }
    getAllCalendars(entityType) {
        throw new Error('Calendar functionality is not available in Expo Go');
    }
}
export default ExpoGoCalendarNextStub;
//# sourceMappingURL=ExpoGoCalendarNextStub.js.map