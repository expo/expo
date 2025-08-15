import type { PermissionResponse } from 'expo-modules-core';

import type { Source } from '../Calendar';

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

  getDefaultCalendar(): void {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  getAllCalendars(): void {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  getCalendars(): void {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  createCalendarNext(): void {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  listEvents(): void {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  async requestCalendarPermissionsAsync(): Promise<PermissionResponse> {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  async getCalendarPermissionsAsync(): Promise<PermissionResponse> {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  async requestRemindersPermissionsAsync(): Promise<PermissionResponse> {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  async getRemindersPermissionsAsync(): Promise<PermissionResponse> {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }

  getSources(): Source[] {
    throw new Error('Calendar@next functionality is not available in Expo Go');
  }
}

export default ExpoGoCalendarNextStub;
