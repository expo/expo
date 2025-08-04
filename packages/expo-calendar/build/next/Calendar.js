import { UnavailabilityError } from 'expo-modules-core';
import { Platform, processColor } from 'react-native';
import { stringifyDateValues, stringifyIfDate, } from '../Calendar';
import InternalExpoCalendar from './ExpoCalendar';
export class ExpoCalendarAttendee extends InternalExpoCalendar.ExpoCalendarAttendee {
}
export class ExpoCalendarEvent extends InternalExpoCalendar.ExpoCalendarEvent {
    getOccurrence(recurringEventOptions = {}) {
        return super.getOccurrence(stringifyDateValues(recurringEventOptions));
    }
    getAttendees(recurringEventOptions = {}) {
        return super.getAttendees(stringifyDateValues(recurringEventOptions));
    }
    update(details) {
        super.update(stringifyDateValues(details));
    }
    delete(options = {}) {
        super.delete(stringifyDateValues(options));
    }
}
export class ExpoCalendarReminder extends InternalExpoCalendar.ExpoCalendarReminder {
    update(details) {
        super.update(stringifyDateValues(details));
    }
}
export class ExpoCalendar extends InternalExpoCalendar.ExpoCalendar {
    createEvent(details) {
        const newEvent = super.createEvent(stringifyDateValues(details));
        if (Platform.OS === 'ios') {
            if (details.hasOwnProperty('creationDate') ||
                details.hasOwnProperty('lastModifiedDate') ||
                details.hasOwnProperty('originalStartDate') ||
                details.hasOwnProperty('isDetached') ||
                details.hasOwnProperty('status') ||
                details.hasOwnProperty('organizer')) {
                console.warn('updateEventAsync was called with one or more read-only properties, which will not be updated');
            }
        }
        Object.setPrototypeOf(newEvent, ExpoCalendarEvent.prototype);
        return newEvent;
    }
    createReminder(details) {
        const newReminder = super.createReminder(stringifyDateValues(details));
        Object.setPrototypeOf(newReminder, ExpoCalendarReminder.prototype);
        return newReminder;
    }
    listEvents(startDate, endDate) {
        if (!startDate) {
            throw new Error('listEvents must be called with a startDate (date) to search for events');
        }
        if (!endDate) {
            throw new Error('listEvents must be called with an endDate (date) to search for events');
        }
        return super.listEvents(stringifyIfDate(startDate), stringifyIfDate(endDate)).map((event) => {
            Object.setPrototypeOf(event, ExpoCalendarEvent.prototype);
            return event;
        });
    }
    async listReminders(startDate, endDate, status) {
        if (!startDate) {
            throw new Error('listReminders must be called with a startDate (date) to search for reminders');
        }
        if (!endDate) {
            throw new Error('listReminders must be called with an endDate (date) to search for reminders');
        }
        const reminders = await super.listReminders(stringifyIfDate(startDate), stringifyIfDate(endDate), status || null);
        return reminders.map((reminder) => {
            Object.setPrototypeOf(reminder, ExpoCalendarReminder.prototype);
            return reminder;
        });
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
                console.warn('ExpoCalendar.update was called with one or more read-only properties, which will not be updated');
            }
        }
        const newDetails = { ...details, color };
        super.update(newDetails);
    }
}
export function getDefaultCalendarNext() {
    if (!InternalExpoCalendar.getDefaultCalendarId) {
        throw new UnavailabilityError('Calendar', 'getDefaultCalendarId');
    }
    return new ExpoCalendar(InternalExpoCalendar.getDefaultCalendarId());
}
export function getCalendarsNext(type) {
    if (!InternalExpoCalendar.getCalendarsIds) {
        throw new UnavailabilityError('Calendar', 'getCalendarsIds');
    }
    return InternalExpoCalendar.getCalendarsIds(type).map((id) => new ExpoCalendar(id));
}
export function createCalendarNext(details = {}) {
    if (!InternalExpoCalendar.createCalendarNext) {
        throw new UnavailabilityError('Calendar', 'createCalendarNext');
    }
    const color = details.color ? processColor(details.color) : undefined;
    const newDetails = { ...details, id: undefined, color: color || undefined };
    const createdCalendar = InternalExpoCalendar.createCalendarNext(newDetails);
    Object.setPrototypeOf(createdCalendar, ExpoCalendar.prototype);
    return createdCalendar;
}
export function listEvents(calendarIds, startDate, endDate) {
    if (!InternalExpoCalendar.listEvents) {
        throw new UnavailabilityError('Calendar', 'listEvents');
    }
    return InternalExpoCalendar.listEvents(calendarIds, stringifyIfDate(startDate), stringifyIfDate(endDate));
}
export const requestCalendarPermissionsAsync = InternalExpoCalendar.requestCalendarPermissionsAsync;
export const getCalendarPermissionsAsync = InternalExpoCalendar.getCalendarPermissionsAsync;
export const requestRemindersPermissionsAsync = InternalExpoCalendar.requestRemindersPermissionsAsync;
export const getRemindersPermissionsAsync = InternalExpoCalendar.getRemindersPermissionsAsync;
export const getSources = InternalExpoCalendar.getSources;
//# sourceMappingURL=Calendar.js.map