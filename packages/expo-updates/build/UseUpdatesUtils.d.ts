import type { UpdateEvent } from './Updates.types';
import type { AvailableUpdateInfo, UpdatesInfo, UseUpdatesCallbacksType } from './UseUpdates.types';
export declare const availableUpdateFromManifest: (manifest: any) => {
    updateId: any;
    createdAt: Date | null;
    manifest: any;
} | undefined;
export declare const updatesInfoFromEvent: (updatesInfo: UpdatesInfo | undefined, event: UpdateEvent) => UpdatesInfo;
export declare const checkForUpdateAndReturnAvailableAsync: (callbacks?: UseUpdatesCallbacksType) => Promise<AvailableUpdateInfo | undefined>;
export declare const downloadUpdateAsync: (callbacks?: UseUpdatesCallbacksType) => Promise<void>;
export declare const runUpdateAsync: (callbacks?: UseUpdatesCallbacksType) => Promise<void>;
export declare const downloadAndRunUpdateAsync: (callbacks?: UseUpdatesCallbacksType) => Promise<void>;
//# sourceMappingURL=UseUpdatesUtils.d.ts.map