import { isRunningInExpoGo } from 'expo';
import { NativeModule, requireNativeModule } from 'expo-modules-core';

import type { CustomExpoCalendar, CustomExpoCalendarEvent } from './ExpoCalendar.types';
import ExpoGoCalendarNextStub from './next/ExpoGoCalendarNextStub';

declare class ExpoCalendarNextModule extends NativeModule {
  CustomExpoCalendar: typeof CustomExpoCalendar;
  CustomExpoCalendarEvent: typeof CustomExpoCalendarEvent;
}

export default isRunningInExpoGo()
  ? (ExpoGoCalendarNextStub as any as ExpoCalendarNextModule)
  : requireNativeModule<ExpoCalendarNextModule>('ExpoCalendar');
