import type { Manifest, UpdatesNativeStateMachineContext, UpdatesNativeStateRollback } from './Updates.types';
import { type CurrentlyRunningInfo, type UpdateInfo } from './UseUpdates.types';
export declare const currentlyRunning: CurrentlyRunningInfo;
export type UseUpdatesStateType = {
    availableUpdate?: UpdateInfo;
    downloadedUpdate?: UpdateInfo;
    checkError?: Error;
    downloadError?: Error;
    initializationError?: Error;
    isUpdateAvailable: boolean;
    isUpdatePending: boolean;
    isChecking: boolean;
    isDownloading: boolean;
    lastCheckForUpdateTimeSinceRestart?: Date;
};
export declare const updateFromManifest: (manifest: NonNullable<Manifest>) => UpdateInfo;
export declare const updateFromRollback: (rollback: UpdatesNativeStateRollback) => UpdateInfo;
export declare const defaultUseUpdatesState: UseUpdatesStateType;
export declare const reduceUpdatesStateFromContext: (updatesState: UseUpdatesStateType, context: UpdatesNativeStateMachineContext) => UseUpdatesStateType;
//# sourceMappingURL=UseUpdatesUtils.d.ts.map