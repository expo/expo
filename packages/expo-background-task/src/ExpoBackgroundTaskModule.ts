import { requireNativeModule } from 'expo-modules-core';
import type { NativeModule } from 'expo-modules-core';

import { BackgroundTaskStatus } from './BackgroundTask.types';

type ExpoBackgroundTaskModuleEventMap = {
  onPerformWork: () => void;
  onWorkDone: () => void;
};

declare class ExpoBackgroundTaskModule extends NativeModule<ExpoBackgroundTaskModuleEventMap> {
  startWorkerAsync(): Promise<boolean>;
  stopWorkerAsync(): Promise<boolean>;
  getStatusAsync(): Promise<BackgroundTaskStatus>;
  isWorkerRunningAsync(): Promise<boolean>;
  workFinished(): void;
  initialiseFromJS(): void;
  EVENT_PERFORM_WORK: string;
  EVENT_WORK_DONE: string;
}

export default requireNativeModule<ExpoBackgroundTaskModule>('ExpoBackgroundTask');
