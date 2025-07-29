import { UnavailabilityError } from 'expo-modules-core';
import { processColor } from 'react-native';
import { stringifyDateValues, stringifyIfDate, } from '../Calendar';
import ExpoCalendar from './ExpoCalendar';
export class ExportExpoCalendarAttendee extends ExpoCalendar.CustomExpoCalendarAttendee {
}
export class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent {
}
export class ExportExpoCalendar extends ExpoCalendar.CustomExpoCalendar {
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
        return super.listEvents(stringifyIfDate(startDate), stringifyIfDate(endDate));
    }
}
export function getDefaultCalendarNext() {
    if (!ExpoCalendar.getDefaultCalendarId) {
        throw new UnavailabilityError('Calendar', 'getDefaultCalendarId');
    }
    return new ExportExpoCalendar(ExpoCalendar.getDefaultCalendarId());
}
export function getCalendarsNext(type) {
    if (!ExpoCalendar.getCalendarsIds) {
        throw new UnavailabilityError('Calendar', 'getCalendarsIds');
    }
    return ExpoCalendar.getCalendarsIds(type).map((id) => new ExportExpoCalendar(id));
}
export async function createCalendarNext(details = {}) {
    if (!ExpoCalendar.createCalendarNext) {
        throw new UnavailabilityError('Calendar', 'createCalendarNext');
    }
    const color = details.color ? processColor(details.color) : undefined;
    const newDetails = { ...details, id: undefined, color };
    return ExpoCalendar.createCalendarNext(newDetails);
}
//# sourceMappingURL=Calendar.js.map