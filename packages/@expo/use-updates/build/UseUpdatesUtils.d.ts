import type { AvailableUpdateInfo, CurrentlyRunningInfo, Manifest, UseUpdatesEvent } from './UseUpdates.types';
export declare const currentlyRunning: CurrentlyRunningInfo;
export declare const availableUpdateFromManifest: (manifest?: Manifest) => {
    updateId: string | null;
    createdAt: Date | null;
    manifest: Manifest;
} | undefined;
export declare const availableUpdateFromEvent: (event: UseUpdatesEvent) => {
    availableUpdate?: AvailableUpdateInfo;
    error?: Error;
};
//# sourceMappingURL=UseUpdatesUtils.d.ts.map