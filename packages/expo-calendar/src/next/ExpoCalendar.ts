import { isRunningInExpoGo } from 'expo';
import { NativeModule, PermissionResponse, requireNativeModule } from 'expo-modules-core';

import {
  ExpoCalendar,
  ExpoCalendarAttendee,
  ExpoCalendarEvent,
  ExpoCalendarReminder,
} from './ExpoCalendar.types';
import { Calendar, EntityTypes, Source } from '../Calendar';
import ExpoGoCalendarNextStub from './ExpoGoCalendarNextStub';

declare class ExpoCalendarNextModule extends NativeModule {
  ExpoCalendar: typeof ExpoCalendar;
  ExpoCalendarEvent: typeof ExpoCalendarEvent;
  ExpoCalendarAttendee: typeof ExpoCalendarAttendee;
  ExpoCalendarReminder: typeof ExpoCalendarReminder;

  getDefaultCalendar(): ExpoCalendar;
  getCalendars(type?: EntityTypes): Promise<ExpoCalendar[]>;
  createCalendarNext(details: Partial<Calendar>): Promise<ExpoCalendar>;

  listEvents(
    calendarIds: string[],
    startDate: string | Date,
    endDate: string | Date
  ): Promise<ExpoCalendarEvent[]>;

  requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
  getCalendarPermissionsAsync(): Promise<PermissionResponse>;
  requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
  getRemindersPermissionsAsync(): Promise<PermissionResponse>;

  getSources(): Source[];
}

export default isRunningInExpoGo()
  ? (ExpoGoCalendarNextStub as any as ExpoCalendarNextModule)
  : requireNativeModule<ExpoCalendarNextModule>('CalendarNext');
