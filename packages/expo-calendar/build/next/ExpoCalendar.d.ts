import { NativeModule } from 'expo-modules-core';
import { CustomExpoCalendar, CustomExpoCalendarAttendee, CustomExpoCalendarEvent } from './ExpoCalendar.types';
import { Calendar, EntityTypes } from '../Calendar';
declare class ExpoCalendarNextModule extends NativeModule {
    CustomExpoCalendar: typeof CustomExpoCalendar;
    CustomExpoCalendarEvent: typeof CustomExpoCalendarEvent;
    CustomExpoCalendarAttendee: typeof CustomExpoCalendarAttendee;
    getDefaultCalendarId(): string;
    getCalendarsIds(type?: EntityTypes): string[];
    createCalendar(details: Partial<Calendar>): string;
}
declare const _default: ExpoCalendarNextModule;
export default _default;
//# sourceMappingURL=ExpoCalendar.d.ts.map