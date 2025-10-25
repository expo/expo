import type { PermissionResponse } from 'expo-modules-core';

class ExpoGoCalendarNextStub {
  static readonly ExpoCalendar = class ExpoCalendar {
    constructor() {
      throw new Error('`ExpoCalendar` is not yet available in the Expo Go managed workflow.');
    }
  };
  static readonly ExpoCalendarEvent = class ExpoCalendarEvent {
    constructor() {
      throw new Error('`ExpoCalendarEvent` is not yet available in the Expo Go managed workflow.');
    }
  };

  static readonly ExpoCalendarReminder = class ExpoCalendarReminder {
    constructor() {
      throw new Error(
        '`ExpoCalendarReminder` is not yet available in the Expo Go managed workflow.'
      );
    }
  };

  static readonly ExpoCalendarAttendee = class ExpoCalendarAttendee {
    constructor() {
      throw new Error(
        '`ExpoCalendarAttendee` is not yet available in the Expo Go managed workflow.'
      );
    }
  };

  getDefaultCalendarSync(): void {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  createCalendar(): void {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  async getCalendars(): Promise<void> {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  async listEvents(): Promise<void> {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  async requestCalendarPermissions(): Promise<PermissionResponse> {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  async getCalendarPermissions(): Promise<PermissionResponse> {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  async requestRemindersPermissions(): Promise<PermissionResponse> {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  async getRemindersPermissions(): Promise<PermissionResponse> {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  getSourcesSync(): void {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }
}

export default ExpoGoCalendarNextStub;
