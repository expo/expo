import { requireNativeModule, type NativeModule } from 'expo';

import { BackgroundTaskOptions, BackgroundTaskStatus } from './BackgroundTask.types';

type ExpoBackgroundTaskEvents = {
  onTasksExpired(): void;
};

declare class ExpoBackgroundTaskModule extends NativeModule<ExpoBackgroundTaskEvents> {
  getStatusAsync(): Promise<BackgroundTaskStatus>;
  registerTaskAsync(name: string, options: BackgroundTaskOptions): Promise<void>;
  unregisterTaskAsync(name: string): Promise<void>;
  triggerTaskWorkerForTestingAsync(): Promise<boolean>;
}

export default requireNativeModule<ExpoBackgroundTaskModule>('ExpoBackgroundTask');
