import { NativeModule } from 'expo-modules-core';
import { CustomExpoCalendar, CustomExpoCalendarEvent } from './ExpoCalendar.types';
declare class ExpoCalendarNextModule extends NativeModule {
    CustomExpoCalendar: typeof CustomExpoCalendar;
    CustomExpoCalendarEvent: typeof CustomExpoCalendarEvent;
    getDefaultCalendar(): CustomExpoCalendar;
    getAllCalendars(entityType?: string): CustomExpoCalendar[];
}
declare const _default: ExpoCalendarNextModule;
export default _default;
//# sourceMappingURL=ExpoCalendar.d.ts.map