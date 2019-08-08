import { UnavailabilityError } from '@unimodules/core';
import { Platform, processColor } from 'react-native';
import ExpoCalendar from './ExpoCalendar';
;
export async function getCalendarsAsync(entityType) {
    if (!ExpoCalendar.getCalendarsAsync) {
        throw new UnavailabilityError('Calendar', 'getCalendarsAsync');
    }
    if (!entityType) {
        return ExpoCalendar.getCalendarsAsync(null);
    }
    return ExpoCalendar.getCalendarsAsync(entityType);
}
export async function createCalendarAsync(details = {}) {
    if (!ExpoCalendar.saveCalendarAsync) {
        throw new UnavailabilityError('Calendar', 'createCalendarAsync');
    }
    let color = details.color ? processColor(details.color) : undefined;
    const newDetails = { ...details, id: undefined, color };
    return ExpoCalendar.saveCalendarAsync(newDetails);
}
export async function updateCalendarAsync(id, details = {}) {
    if (!ExpoCalendar.saveCalendarAsync) {
        throw new UnavailabilityError('Calendar', 'updateCalendarAsync');
    }
    if (!id) {
        throw new Error('updateCalendarAsync must be called with an id (string) of the target calendar');
    }
    let color = details.color ? processColor(details.color) : undefined;
    if (Platform.OS === 'android') {
        if (details.hasOwnProperty('source') ||
            details.hasOwnProperty('color') ||
            details.hasOwnProperty('allowsModifications') ||
            details.hasOwnProperty('allowedAvailabilities') ||
            details.hasOwnProperty('isPrimary') ||
            details.hasOwnProperty('ownerAccount') ||
            details.hasOwnProperty('timeZone') ||
            details.hasOwnProperty('allowedReminders') ||
            details.hasOwnProperty('allowedAttendeeTypes') ||
            details.hasOwnProperty('accessLevel')) {
            console.warn('updateCalendarAsync was called with one or more read-only properties, which will not be updated');
        }
    }
    else {
        if (details.hasOwnProperty('source') ||
            details.hasOwnProperty('type') ||
            details.hasOwnProperty('entityType') ||
            details.hasOwnProperty('allowsModifications') ||
            details.hasOwnProperty('allowedAvailabilities')) {
            console.warn('updateCalendarAsync was called with one or more read-only properties, which will not be updated');
        }
    }
    const newDetails = { ...details, id, color };
    return ExpoCalendar.saveCalendarAsync(newDetails);
}
export async function deleteCalendarAsync(id) {
    if (!ExpoCalendar.deleteCalendarAsync) {
        throw new UnavailabilityError('Calendar', 'deleteCalendarAsync');
    }
    if (!id) {
        throw new Error('deleteCalendarAsync must be called with an id (string) of the target calendar');
    }
    return ExpoCalendar.deleteCalendarAsync(id);
}
export async function getEventsAsync(calendarIds, startDate, endDate) {
    if (!ExpoCalendar.getEventsAsync) {
        throw new UnavailabilityError('Calendar', 'getEventsAsync');
    }
    if (!startDate) {
        throw new Error('getEventsAsync must be called with a startDate (date) to search for events');
    }
    if (!endDate) {
        throw new Error('getEventsAsync must be called with an endDate (date) to search for events');
    }
    if (!calendarIds || !calendarIds.length) {
        throw new Error('getEventsAsync must be called with a non-empty array of calendarIds to search');
    }
    return ExpoCalendar.getEventsAsync(stringifyIfDate(startDate), stringifyIfDate(endDate), calendarIds);
}
export async function getEventAsync(id, { futureEvents = false, instanceStartDate } = {}) {
    if (!ExpoCalendar.getEventByIdAsync) {
        throw new UnavailabilityError('Calendar', 'getEventAsync');
    }
    if (!id) {
        throw new Error('getEventAsync must be called with an id (string) of the target event');
    }
    if (Platform.OS === 'ios') {
        return ExpoCalendar.getEventByIdAsync(id, instanceStartDate);
    }
    else {
        return ExpoCalendar.getEventByIdAsync(id);
    }
}
export async function createEventAsync(calendarId, { id, ...details } = {}) {
    if (!ExpoCalendar.saveEventAsync) {
        throw new UnavailabilityError('Calendar', 'createEventAsync');
    }
    if (!calendarId) {
        throw new Error('createEventAsync must be called with an id (string) of the target calendar');
    }
    if (Platform.OS === 'android') {
        if (!details.startDate) {
            throw new Error('createEventAsync requires a startDate (Date)');
        }
        if (!details.endDate) {
            throw new Error('createEventAsync requires an endDate (Date)');
        }
    }
    const newDetails = {
        ...details,
        calendarId
    };
    return ExpoCalendar.saveEventAsync(stringifyDateValues(newDetails), {});
}
export async function updateEventAsync(id, details = {}, { futureEvents = false, instanceStartDate } = {}) {
    if (!ExpoCalendar.saveEventAsync) {
        throw new UnavailabilityError('Calendar', 'updateEventAsync');
    }
    if (!id) {
        throw new Error('updateEventAsync must be called with an id (string) of the target event');
    }
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
    const newDetails = { ...details, id, instanceStartDate };
    return ExpoCalendar.saveEventAsync(stringifyDateValues(newDetails), { futureEvents });
}
export async function deleteEventAsync(id, { futureEvents = false, instanceStartDate } = {}) {
    if (!ExpoCalendar.deleteEventAsync) {
        throw new UnavailabilityError('Calendar', 'deleteEventAsync');
    }
    if (!id) {
        throw new Error('deleteEventAsync must be called with an id (string) of the target event');
    }
    return ExpoCalendar.deleteEventAsync({ id, instanceStartDate }, { futureEvents });
}
export async function getAttendeesForEventAsync(id, { futureEvents = false, instanceStartDate } = {}) {
    if (!ExpoCalendar.getAttendeesForEventAsync) {
        throw new UnavailabilityError('Calendar', 'getAttendeesForEventAsync');
    }
    if (!id) {
        throw new Error('getAttendeesForEventAsync must be called with an id (string) of the target event');
    }
    // Android only takes an ID, iOS takes an object
    const params = Platform.OS === 'ios' ? { id, instanceStartDate } : id;
    return ExpoCalendar.getAttendeesForEventAsync(params);
}
export async function createAttendeeAsync(eventId, details = {}) {
    if (!ExpoCalendar.saveAttendeeForEventAsync) {
        throw new UnavailabilityError('Calendar', 'createAttendeeAsync');
    }
    if (!eventId) {
        throw new Error('createAttendeeAsync must be called with an id (string) of the target event');
    }
    if (!details.email) {
        throw new Error('createAttendeeAsync requires an email (string)');
    }
    if (!details.role) {
        throw new Error('createAttendeeAsync requires a role (string)');
    }
    if (!details.type) {
        throw new Error('createAttendeeAsync requires a type (string)');
    }
    if (!details.status) {
        throw new Error('createAttendeeAsync requires a status (string)');
    }
    const newDetails = { ...details, id: undefined };
    return ExpoCalendar.saveAttendeeForEventAsync(newDetails, eventId);
} // Android
export async function updateAttendeeAsync(id, details = {}) {
    if (!ExpoCalendar.saveAttendeeForEventAsync) {
        throw new UnavailabilityError('Calendar', 'updateAttendeeAsync');
    }
    if (!id) {
        throw new Error('updateAttendeeAsync must be called with an id (string) of the target event');
    }
    const newDetails = { ...details, id };
    return ExpoCalendar.saveAttendeeForEventAsync(newDetails, null);
} // Android
export async function deleteAttendeeAsync(id) {
    if (!ExpoCalendar.deleteAttendeeAsync) {
        throw new UnavailabilityError('Calendar', 'deleteAttendeeAsync');
    }
    if (!id) {
        throw new Error('deleteAttendeeAsync must be called with an id (string) of the target event');
    }
    return ExpoCalendar.deleteAttendeeAsync(id);
} // Android
export async function getRemindersAsync(calendarIds, status, startDate, endDate) {
    if (!ExpoCalendar.getRemindersAsync) {
        throw new UnavailabilityError('Calendar', 'getRemindersAsync');
    }
    if (status && !startDate) {
        throw new Error('getRemindersAsync must be called with a startDate (date) to search for reminders');
    }
    if (status && !endDate) {
        throw new Error('getRemindersAsync must be called with an endDate (date) to search for reminders');
    }
    if (!calendarIds || !calendarIds.length) {
        throw new Error('getRemindersAsync must be called with a non-empty array of calendarIds to search');
    }
    return ExpoCalendar.getRemindersAsync(stringifyIfDate(startDate) || null, stringifyIfDate(endDate) || null, calendarIds, status || null);
} // iOS
export async function getReminderAsync(id) {
    if (!ExpoCalendar.getReminderByIdAsync) {
        throw new UnavailabilityError('Calendar', 'getReminderAsync');
    }
    if (!id) {
        throw new Error('getReminderAsync must be called with an id (string) of the target reminder');
    }
    return ExpoCalendar.getReminderByIdAsync(id);
} // iOS
export async function createReminderAsync(calendarId, { id, ...details } = {}) {
    if (!ExpoCalendar.saveReminderAsync) {
        throw new UnavailabilityError('Calendar', 'createReminderAsync');
    }
    const newDetails = {
        ...details,
        calendarId: calendarId === null ? undefined : calendarId
    };
    return ExpoCalendar.saveReminderAsync(stringifyDateValues(newDetails));
} // iOS
export async function updateReminderAsync(id, details = {}) {
    if (!ExpoCalendar.saveReminderAsync) {
        throw new UnavailabilityError('Calendar', 'updateReminderAsync');
    }
    if (!id) {
        throw new Error('updateReminderAsync must be called with an id (string) of the target reminder');
    }
    if (details.hasOwnProperty('creationDate') || details.hasOwnProperty('lastModifiedDate')) {
        console.warn('updateReminderAsync was called with one or more read-only properties, which will not be updated');
    }
    const newDetails = { ...details, id };
    return ExpoCalendar.saveReminderAsync(stringifyDateValues(newDetails));
} // iOS
export async function deleteReminderAsync(id) {
    if (!ExpoCalendar.deleteReminderAsync) {
        throw new UnavailabilityError('Calendar', 'deleteReminderAsync');
    }
    if (!id) {
        throw new Error('deleteReminderAsync must be called with an id (string) of the target reminder');
    }
    return ExpoCalendar.deleteReminderAsync(id);
} // iOS
export async function getSourcesAsync() {
    if (!ExpoCalendar.getSourcesAsync) {
        throw new UnavailabilityError('Calendar', 'getSourcesAsync');
    }
    return ExpoCalendar.getSourcesAsync();
} // iOS
export async function getSourceAsync(id) {
    if (!ExpoCalendar.getSourceByIdAsync) {
        throw new UnavailabilityError('Calendar', 'getSourceAsync');
    }
    if (!id) {
        throw new Error('getSourceAsync must be called with an id (string) of the target source');
    }
    return ExpoCalendar.getSourceByIdAsync(id);
} // iOS
export function openEventInCalendar(id) {
    if (!ExpoCalendar.openEventInCalendar) {
        console.warn(`openEventInCalendar is not available on platform: ${Platform.OS}`);
        return;
    }
    if (!id) {
        throw new Error('openEventInCalendar must be called with an id (string) of the target event');
    }
    return ExpoCalendar.openEventInCalendar(parseInt(id, 10));
} // Android
export async function requestPermissionsAsync() {
    if (!ExpoCalendar.requestPermissionsAsync) {
        throw new UnavailabilityError('Calendar', 'requestPermissionsAsync');
    }
    return await ExpoCalendar.requestPermissionsAsync();
}
export async function requestRemindersPermissionsAsync() {
    if (!ExpoCalendar.requestRemindersPermissionsAsync) {
        throw new UnavailabilityError('Calendar', 'requestRemindersPermissionsAsync');
    }
    return await ExpoCalendar.requestRemindersPermissionsAsync();
}
export const EntityTypes = {
    EVENT: 'event',
    REMINDER: 'reminder',
};
export const Frequency = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
};
export const Availability = {
    NOT_SUPPORTED: 'notSupported',
    BUSY: 'busy',
    FREE: 'free',
    TENTATIVE: 'tentative',
    UNAVAILABLE: 'unavailable',
};
export const CalendarType = {
    LOCAL: 'local',
    CALDAV: 'caldav',
    EXCHANGE: 'exchange',
    SUBSCRIBED: 'subscribed',
    BIRTHDAYS: 'birthdays',
    UNKNOWN: 'unknown',
}; // iOS
export const EventStatus = {
    NONE: 'none',
    CONFIRMED: 'confirmed',
    TENTATIVE: 'tentative',
    CANCELED: 'canceled',
};
export const SourceType = {
    LOCAL: 'local',
    EXCHANGE: 'exchange',
    CALDAV: 'caldav',
    MOBILEME: 'mobileme',
    SUBSCRIBED: 'subscribed',
    BIRTHDAYS: 'birthdays',
};
export const AttendeeRole = {
    UNKNOWN: 'unknown',
    REQUIRED: 'required',
    OPTIONAL: 'optional',
    CHAIR: 'chair',
    NON_PARTICIPANT: 'nonParticipant',
    ATTENDEE: 'attendee',
    ORGANIZER: 'organizer',
    PERFORMER: 'performer',
    SPEAKER: 'speaker',
    NONE: 'none',
};
export const AttendeeStatus = {
    UNKNOWN: 'unknown',
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    TENTATIVE: 'tentative',
    DELEGATED: 'delegated',
    COMPLETED: 'completed',
    IN_PROCESS: 'inProcess',
    INVITED: 'invited',
    NONE: 'none',
};
export const AttendeeType = {
    UNKNOWN: 'unknown',
    PERSON: 'person',
    ROOM: 'room',
    GROUP: 'group',
    RESOURCE: 'resource',
    OPTIONAL: 'optional',
    REQUIRED: 'required',
    NONE: 'none',
};
export const AlarmMethod = {
    ALARM: 'alarm',
    ALERT: 'alert',
    EMAIL: 'email',
    SMS: 'sms',
    DEFAULT: 'default',
};
export const EventAccessLevel = {
    CONFIDENTIAL: 'confidential',
    PRIVATE: 'private',
    PUBLIC: 'public',
    DEFAULT: 'default',
};
export const CalendarAccessLevel = {
    CONTRIBUTOR: 'contributor',
    EDITOR: 'editor',
    FREEBUSY: 'freebusy',
    OVERRIDE: 'override',
    OWNER: 'owner',
    READ: 'read',
    RESPOND: 'respond',
    ROOT: 'root',
    NONE: 'none',
};
export const ReminderStatus = {
    COMPLETED: 'completed',
    INCOMPLETE: 'incomplete',
};
function stringifyIfDate(date) {
    return date instanceof Date ? date.toISOString() : date;
}
function stringifyDateValues(obj) {
    return Object.keys(obj).reduce((acc, key) => {
        acc[key] = stringifyIfDate(obj[key]);
        return acc;
    }, {});
}
//# sourceMappingURL=Calendar.js.map