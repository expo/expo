import type { Manifest, UpdateEvent } from './Updates.types';
import type { AvailableUpdateInfo, UpdatesInfo, UpdatesProviderCallbacksType } from './UpdatesProvider.types';
export declare const availableUpdateFromManifest: (manifest: Manifest | undefined) => {
    updateId: string | null;
    createdAt: Date | null;
    manifest: import("expo-constants/build/Constants.types").AppManifest | import("expo-constants/build/Constants.types").Manifest;
} | undefined;
export declare const updatesInfoFromEvent: (event: UpdateEvent) => UpdatesInfo;
export declare const checkForUpdateAndReturnAvailableAsync: (callbacks?: UpdatesProviderCallbacksType) => Promise<AvailableUpdateInfo | undefined>;
export declare const downloadUpdateAsync: (callbacks?: UpdatesProviderCallbacksType) => Promise<void>;
export declare const runUpdateAsync: (callbacks?: UpdatesProviderCallbacksType) => Promise<void>;
export declare const downloadAndRunUpdateAsync: (callbacks?: UpdatesProviderCallbacksType) => Promise<void>;
//# sourceMappingURL=UpdatesProviderUtils.d.ts.map