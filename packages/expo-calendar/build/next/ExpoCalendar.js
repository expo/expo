import { isRunningInExpoGo } from 'expo';
import { requireNativeModule } from 'expo-modules-core';
import ExpoGoCalendarNextStub from './ExpoGoCalendarNextStub';
export default isRunningInExpoGo()
    ? ExpoGoCalendarNextStub
    : requireNativeModule('CalendarNext');
//# sourceMappingURL=ExpoCalendar.js.map