import { stringifyDateValues, stringifyIfDate } from '../Calendar';
import ExpoCalendar from './ExpoCalendar';
export class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent {
    constructor(id) {
        super(id);
    }
}
export class ExportExpoCalendar extends ExpoCalendar.CustomExpoCalendar {
    constructor(id) {
        super(id);
    }
    createEvent(details, options) {
        return super.createEvent(stringifyDateValues(details), options);
    }
    listEvents(startDate, endDate) {
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
export const getDefaultCalendarNext = () => new ExportExpoCalendar(ExpoCalendar.getDefaultCalendarId());
export const getCalendarsNext = (type) => ExpoCalendar.getCalendarsIds(type).map((id) => new ExportExpoCalendar(id));
//# sourceMappingURL=Calendar.js.map