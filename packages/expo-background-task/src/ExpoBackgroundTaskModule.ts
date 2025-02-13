import { requireNativeModule, type NativeModule } from 'expo';

import { BackgroundTaskOptions, BackgroundTaskStatus } from './BackgroundTask.types';

declare class ExpoBackgroundTaskModule extends NativeModule {
  getStatusAsync(): Promise<BackgroundTaskStatus>;
  registerTaskAsync(name: string, options: BackgroundTaskOptions): Promise<void>;
  unregisterTaskAsync(name: string): Promise<void>;
  triggerTaskWorkerForTestingAsync(): Promise<boolean>;
}

export default requireNativeModule<ExpoBackgroundTaskModule>('ExpoBackgroundTask');
