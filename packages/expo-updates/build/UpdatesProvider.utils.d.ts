import type { Manifest, UpdateEvent } from './Updates.types';
import type { AvailableUpdateInfo, UpdatesInfo, UpdatesProviderEvent } from './UpdatesProvider.types';
export declare const availableUpdateFromManifest: (manifest: Partial<Manifest> | undefined) => {
    updateId: string | null;
    createdAt: Date | null;
    manifest: Partial<import("expo-constants/build/Constants.types").AppManifest> | Partial<import("expo-constants/build/Constants.types").Manifest>;
} | undefined;
export declare const updatesInfoFromEvent: (event: UpdateEvent) => UpdatesInfo;
export declare const checkForUpdateAndReturnAvailableAsync: (providerEventHandler?: (event: UpdatesProviderEvent) => void) => Promise<AvailableUpdateInfo | undefined>;
export declare const downloadUpdateAsync: (providerEventHandler?: ((event: UpdatesProviderEvent) => void) | undefined) => Promise<void>;
export declare const runUpdateAsync: (providerEventHandler?: ((event: UpdatesProviderEvent) => void) | undefined) => Promise<void>;
export declare const downloadAndRunUpdateAsync: (providerEventHandler?: ((event: UpdatesProviderEvent) => void) | undefined) => Promise<void>;
//# sourceMappingURL=UpdatesProvider.utils.d.ts.map