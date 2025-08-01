import { isRunningInExpoGo } from 'expo';
import { requireNativeModule } from 'expo-modules-core';
import ExpoGoCalendarNextStub from './next/ExpoGoCalendarNextStub';
export default isRunningInExpoGo()
    ? ExpoGoCalendarNextStub
    : requireNativeModule('ExpoCalendar');
//# sourceMappingURL=ExpoCalendar.js.map