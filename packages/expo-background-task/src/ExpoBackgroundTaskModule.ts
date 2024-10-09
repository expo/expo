import { requireNativeModule } from 'expo-modules-core';
import type { NativeModule } from 'expo-modules-core';

import { BackgroundTaskStatus } from './BackgroundTask.types';

declare class ExpoBackgroundTaskModule extends NativeModule {
  startWorkerAsync(): Promise<boolean>;
  stopWorkerAsync(): Promise<boolean>;
  getStatusAsync(): Promise<BackgroundTaskStatus>;
  isWorkerRunningAsync(): Promise<boolean>;
  workFinished(): void;
  EVENT_NAME: string;
}

export default requireNativeModule('ExpoBackgroundTask') as ExpoBackgroundTaskModule;
