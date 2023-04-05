import type { UpdateEvent } from 'expo-updates';
import type { AvailableUpdateInfo, CurrentlyRunningInfo, Manifest, UseUpdatesCallbacksType } from './UseUpdates.types';
export declare const currentlyRunning: CurrentlyRunningInfo;
export declare const availableUpdateFromManifest: (manifest?: Manifest) => {
    updateId: string | null;
    createdAt: Date | null;
    manifest: Manifest;
} | undefined;
export declare const availableUpdateFromEvent: (event: UpdateEvent) => {
    availableUpdate?: AvailableUpdateInfo;
    error?: Error;
};
export declare const checkForUpdateAndReturnAvailableAsync: (callbacks?: UseUpdatesCallbacksType) => Promise<AvailableUpdateInfo | undefined>;
export declare const downloadUpdateAsync: (callbacks?: UseUpdatesCallbacksType) => Promise<void>;
export declare const runUpdateAsync: (callbacks?: UseUpdatesCallbacksType) => Promise<void>;
export declare const downloadAndRunUpdateAsync: (callbacks?: UseUpdatesCallbacksType) => Promise<void>;
//# sourceMappingURL=UseUpdatesUtils.d.ts.map