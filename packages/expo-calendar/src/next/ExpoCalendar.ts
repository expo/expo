import { NativeModule, PermissionResponse, requireNativeModule } from 'expo-modules-core';

import {
  ExpoCalendar,
  ExpoCalendarAttendee,
  ExpoCalendarEvent,
  ExpoCalendarReminder,
} from './ExpoCalendar.types';
import { Calendar, EntityTypes, Source } from '../Calendar';

declare class ExpoCalendarNextModule extends NativeModule {
  ExpoCalendar: typeof ExpoCalendar;
  ExpoCalendarEvent: typeof ExpoCalendarEvent;
  ExpoCalendarAttendee: typeof ExpoCalendarAttendee;
  ExpoCalendarReminder: typeof ExpoCalendarReminder;
  getDefaultCalendarId(): string;
  getCalendarsIds(type?: EntityTypes): string[];
  createCalendarNext(details: Partial<Calendar>): ExpoCalendar;
  requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
  getCalendarPermissionsAsync(): Promise<PermissionResponse>;
  requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
  getRemindersPermissionsAsync(): Promise<PermissionResponse>;
  getSources(): Source[];
}

// TODO: Support Expo Go
export default requireNativeModule<ExpoCalendarNextModule>('CalendarNext');
