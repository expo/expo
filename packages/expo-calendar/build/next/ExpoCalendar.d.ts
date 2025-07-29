import { NativeModule } from 'expo-modules-core';
import { CustomExpoCalendar, CustomExpoCalendarAttendee, CustomExpoCalendarEvent } from './ExpoCalendar.types';
declare class ExpoCalendarNextModule extends NativeModule {
    CustomExpoCalendar: typeof CustomExpoCalendar;
    CustomExpoCalendarEvent: typeof CustomExpoCalendarEvent;
    CustomExpoCalendarAttendee: typeof CustomExpoCalendarAttendee;
    getDefaultCalendarId(): string;
    getCalendarsIds(): string[];
}
declare const _default: ExpoCalendarNextModule;
export default _default;
//# sourceMappingURL=ExpoCalendar.d.ts.map