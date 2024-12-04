import type { NativeModule } from 'expo-modules-core';
import { BackgroundTaskOptions, BackgroundTaskStatus } from './BackgroundTask.types';
declare class ExpoBackgroundTaskModule extends NativeModule {
    getStatusAsync(): Promise<BackgroundTaskStatus>;
    registerTaskAsync(name: string, options: BackgroundTaskOptions): Promise<void>;
    unregisterTaskAsync(name: string): Promise<void>;
    triggerTaskWorkerForTestingAsync(): Promise<void>;
}
declare const _default: ExpoBackgroundTaskModule;
export default _default;
//# sourceMappingURL=ExpoBackgroundTaskModule.d.ts.map