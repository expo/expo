import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

import { EntityTypes, Source } from '../Calendar';

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  canAskAgain: true,
  granted: false,
  expires: 'never',
};

class ExpoCalendar {
  constructor(id: string) {
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

  getDefaultCalendar(): ExpoCalendar {
    throw new Error('Calendar API is not available on web');
  },

  async getCalendars(type?: EntityTypes): Promise<ExpoCalendar[]> {
    return [];
  },

  async listEvents(
    calendars: string[],
    startDate: string | Date,
    endDate: string | Date
  ): Promise<ExpoCalendarEvent[]> {
    return [];
  },

  async getCalendarById(calendarId: string): Promise<ExpoCalendar> {
    throw new Error('Calendar API is not available on web');
  },

  async getEventById(eventId: string): Promise<ExpoCalendarEvent> {
    throw new Error('Calendar API is not available on web');
  },

  async getReminderById(reminderId: string): Promise<ExpoCalendarReminder> {
    throw new Error('Calendar API is not available on web');
  },

  async requestCalendarPermissions(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },

  async getCalendarPermissions(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },

  async requestRemindersPermissions(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },

  async getRemindersPermissions(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },

  getSourcesSync(): Source[] {
    return [];
  },
};
