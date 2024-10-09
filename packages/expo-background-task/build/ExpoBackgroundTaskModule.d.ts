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
declare const _default: ExpoBackgroundTaskModule;
export default _default;
//# sourceMappingURL=ExpoBackgroundTaskModule.d.ts.map