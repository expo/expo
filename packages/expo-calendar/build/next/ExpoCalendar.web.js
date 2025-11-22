import { PermissionStatus } from 'expo-modules-core';
const noPermissionResponse = {
    status: PermissionStatus.UNDETERMINED,
    canAskAgain: true,
    granted: false,
    expires: 'never',
};
class ExpoCalendar {
    constructor(id) {
        throw new Error('Calendar API is not available on web');
    }
}
class ExpoCalendarEvent {
    constructor() {
        throw new Error('Calendar API is not available on web');
    }
}
class ExpoCalendarAttendee {
    constructor() {
        throw new Error('Calendar API is not available on web');
    }
}
class ExpoCalendarReminder {
    constructor() {
        throw new Error('Calendar API is not available on web');
    }
}
export default {
    ExpoCalendar,
    ExpoCalendarEvent,
    ExpoCalendarAttendee,
    ExpoCalendarReminder,
    getDefaultCalendar() {
        throw new Error('Calendar API is not available on web');
    },
    async getCalendars(type) {
        return [];
    },
    async listEvents(calendars, startDate, endDate) {
        return [];
    },
    async getCalendarById(calendarId) {
        throw new Error('Calendar API is not available on web');
    },
    async getEventById(eventId) {
        throw new Error('Calendar API is not available on web');
    },
    async getReminderById(reminderId) {
        throw new Error('Calendar API is not available on web');
    },
    async requestCalendarPermissions() {
        return noPermissionResponse;
    },
    async getCalendarPermissions() {
        return noPermissionResponse;
    },
    async requestRemindersPermissions() {
        return noPermissionResponse;
    },
    async getRemindersPermissions() {
        return noPermissionResponse;
    },
    getSourcesSync() {
        return [];
    },
};
//# sourceMappingURL=ExpoCalendar.web.js.map