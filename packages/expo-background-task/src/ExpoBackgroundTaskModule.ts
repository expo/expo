import { requireNativeModule } from 'expo-modules-core';
import type { NativeModule } from 'expo-modules-core';

import { BackgroundTaskOptions, BackgroundTaskStatus } from './BackgroundTask.types';

declare class ExpoBackgroundTaskModule extends NativeModule {
  getStatusAsync(): Promise<BackgroundTaskStatus>;
  registerTaskAsync(name: string, options: BackgroundTaskOptions): Promise<void>;
  unregisterTaskAsync(name: string): Promise<void>;
  triggerTaskForTestingAsync(name: string): Promise<void>;
}

export default requireNativeModule<ExpoBackgroundTaskModule>('ExpoBackgroundTask');
