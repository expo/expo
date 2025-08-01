import { UnavailabilityError } from 'expo-modules-core';
import { Platform, processColor } from 'react-native';
import { stringifyDateValues, stringifyIfDate, } from '../Calendar';
import ExpoCalendar from './ExpoCalendar';
export class ExportExpoCalendarAttendee extends ExpoCalendar.CustomExpoCalendarAttendee {
}
export class ExportExpoCalendarEvent extends ExpoCalendar.CustomExpoCalendarEvent {
}
export class ExportExpoCalendarReminder extends ExpoCalendar.CustomExpoCalendarReminder {
}
export class ExportExpoCalendar extends ExpoCalendar.CustomExpoCalendar {
    createEvent(details) {
        return super.createEvent(stringifyDateValues(details));
    }
    createReminder(details) {
        return super.createReminder(stringifyDateValues(details));
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
    async listReminders(startDate, endDate, status) {
        if (!startDate) {
            throw new Error('listReminders must be called with a startDate (date) to search for reminders');
        }
        if (!endDate) {
            throw new Error('listReminders must be called with an endDate (date) to search for reminders');
        }
        return super.listReminders(stringifyIfDate(startDate), stringifyIfDate(endDate), status || null);
    }
    update(details) {
        const color = details.color ? processColor(details.color)?.toString() : undefined;
        if (Platform.OS === 'android') {
            // TODO: Implement
            throw new Error('Not implemented yet');
        }
        else {
            if (details.hasOwnProperty('source') ||
                details.hasOwnProperty('type') ||
                details.hasOwnProperty('entityType') ||
                details.hasOwnProperty('allowsModifications') ||
                details.hasOwnProperty('allowedAvailabilities')) {
                console.warn('ExportExpoCalendar.update was called with one or more read-only properties, which will not be updated');
            }
        }
        const newDetails = { ...details, color };
        super.update(newDetails);
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
export function createCalendarNext(details = {}) {
    if (!ExpoCalendar.createCalendarNext) {
        throw new UnavailabilityError('Calendar', 'createCalendarNext');
    }
    const color = details.color ? processColor(details.color) : undefined;
    const newDetails = { ...details, id: undefined, color: color || undefined };
    const createdCalendar = ExpoCalendar.createCalendarNext(newDetails);
    Object.setPrototypeOf(createdCalendar, ExportExpoCalendar.prototype);
    return createdCalendar;
}
export const requestCalendarPermissionsAsync = ExpoCalendar.requestCalendarPermissionsAsync;
export const getCalendarPermissionsAsync = ExpoCalendar.getCalendarPermissionsAsync;
export const requestRemindersPermissionsAsync = ExpoCalendar.requestRemindersPermissionsAsync;
export const getRemindersPermissionsAsync = ExpoCalendar.getRemindersPermissionsAsync;
//# sourceMappingURL=Calendar.js.map