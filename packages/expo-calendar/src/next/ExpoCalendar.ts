import { NativeModule, requireNativeModule } from 'expo-modules-core';

import {
  CustomExpoCalendar,
  CustomExpoCalendarAttendee,
  CustomExpoCalendarEvent,
} from './ExpoCalendar.types';
import { Calendar, EntityTypes } from '../Calendar';

declare class ExpoCalendarNextModule extends NativeModule {
  CustomExpoCalendar: typeof CustomExpoCalendar;
  CustomExpoCalendarEvent: typeof CustomExpoCalendarEvent;
  CustomExpoCalendarAttendee: typeof CustomExpoCalendarAttendee;
  getDefaultCalendarId(): string;
  getCalendarsIds(type?: EntityTypes): string[];
  createCalendar(details: Partial<Calendar>): string;
}

// TODO: Support Expo Go
export default requireNativeModule<ExpoCalendarNextModule>('CalendarNext');
