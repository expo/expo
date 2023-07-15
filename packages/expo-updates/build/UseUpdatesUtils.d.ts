import type { Manifest, UpdatesNativeStateMachineContext } from './Updates.types';
import { UpdateInfoType, type CurrentlyRunningInfo, type UpdateInfo } from './UseUpdates.types';
export declare const currentlyRunning: CurrentlyRunningInfo;
export type UseUpdatesStateType = {
    availableUpdate?: UpdateInfo;
    downloadedUpdate?: UpdateInfo;
    checkError?: Error;
    downloadError?: Error;
    isUpdateAvailable: boolean;
    isUpdatePending: boolean;
    isChecking: boolean;
    isDownloading: boolean;
    lastCheckForUpdateTimeSinceRestart?: Date;
};
export declare const updateFromManifest: (manifest?: Manifest) => {
    type: UpdateInfoType;
    updateId: string | undefined;
    createdAt: Date;
    manifest: import("expo-constants/build/Constants.types").AppManifest | import("expo-constants/build/Constants.types").Manifest;
} | undefined;
export declare const availableUpdateFromContext: (context: UpdatesNativeStateMachineContext) => {
    type: UpdateInfoType;
    updateId: string | undefined;
    createdAt: Date;
    manifest: import("expo-constants/build/Constants.types").AppManifest | import("expo-constants/build/Constants.types").Manifest;
} | undefined;
export declare const downloadedUpdateFromContext: (context: UpdatesNativeStateMachineContext) => {
    type: UpdateInfoType;
    updateId: string | undefined;
    createdAt: Date;
    manifest: import("expo-constants/build/Constants.types").AppManifest | import("expo-constants/build/Constants.types").Manifest;
} | undefined;
export declare const defaultUseUpdatesState: UseUpdatesStateType;
export declare const reduceUpdatesStateFromContext: (updatesState: UseUpdatesStateType, context: UpdatesNativeStateMachineContext) => {
    isChecking: boolean;
    lastCheckForUpdateTimeSinceRestart: Date;
    availableUpdate?: UpdateInfo | undefined;
    downloadedUpdate?: UpdateInfo | undefined;
    checkError?: Error | undefined;
    downloadError?: Error | undefined;
    isUpdateAvailable: boolean;
    isUpdatePending: boolean;
    isDownloading: boolean;
} | {
    isUpdateAvailable: boolean;
    isUpdatePending: boolean;
    isChecking: false;
    isDownloading: boolean;
    availableUpdate: {
        type: UpdateInfoType;
        updateId: string | undefined;
        createdAt: Date;
        manifest: import("expo-constants/build/Constants.types").AppManifest | import("expo-constants/build/Constants.types").Manifest;
    } | undefined;
    downloadedUpdate: {
        type: UpdateInfoType;
        updateId: string | undefined;
        createdAt: Date;
        manifest: import("expo-constants/build/Constants.types").AppManifest | import("expo-constants/build/Constants.types").Manifest;
    } | undefined;
    checkError: Error | undefined;
    downloadError: Error | undefined;
    lastCheckForUpdateTimeSinceRestart?: Date | undefined;
};
//# sourceMappingURL=UseUpdatesUtils.d.ts.map