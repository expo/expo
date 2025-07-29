import { NativeModule, requireNativeModule } from 'expo-modules-core';

import {
  CustomExpoCalendar,
  CustomExpoCalendarAttendee,
  CustomExpoCalendarEvent,
} from './ExpoCalendar.types';

declare class ExpoCalendarNextModule extends NativeModule {
  CustomExpoCalendar: typeof CustomExpoCalendar;
  CustomExpoCalendarEvent: typeof CustomExpoCalendarEvent;
  CustomExpoCalendarAttendee: typeof CustomExpoCalendarAttendee;
  getDefaultCalendar(): CustomExpoCalendar;
  getAllCalendars(entityType?: string): CustomExpoCalendar[];
  //   requestPermissions(): Promise<any>;
  //   getPermissions(): Promise<any>;
}

// TODO: Support Expo Go
export default requireNativeModule<ExpoCalendarNextModule>('CalendarNext');
