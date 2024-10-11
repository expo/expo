import type { NativeModule } from 'expo-modules-core';
import { BackgroundTaskStatus } from './BackgroundTask.types';
type ExpoBackgroundTaskModuleEventMap = {
    onPerformWork: () => void;
};
declare class ExpoBackgroundTaskModule extends NativeModule<ExpoBackgroundTaskModuleEventMap> {
    startWorkerAsync(): Promise<boolean>;
    stopWorkerAsync(): Promise<boolean>;
    getStatusAsync(): Promise<BackgroundTaskStatus>;
    isWorkerRunningAsync(): Promise<boolean>;
    workFinished(): void;
    initialiseFromJS(): void;
    EVENT_PERFORM_WORK: string;
}
declare const _default: ExpoBackgroundTaskModule;
export default _default;
//# sourceMappingURL=ExpoBackgroundTaskModule.d.ts.map