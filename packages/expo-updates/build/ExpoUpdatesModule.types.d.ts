import { ProxyNativeModule } from 'expo-modules-core';
import { Manifest, UpdateCheckResultAvailable, UpdateCheckResultNotAvailable, UpdateCheckResultRollBack, UpdateFetchResultRollBackToEmbedded, UpdateFetchResultFailure, UpdateFetchResultSuccess, UpdatesLogEntry, UpdatesNativeStateMachineContext } from './Updates.types';
/**
 * @internal
 */
export interface ExpoUpdatesModule extends Pick<ProxyNativeModule, 'addListener' | 'removeListeners'> {
    isEmergencyLaunch?: boolean;
    isEmbeddedLaunch: boolean;
    isEnabled: boolean;
    isUsingEmbeddedAssets?: boolean;
    /**
     * Can be empty string
     */
    runtimeVersion: string;
    checkAutomatically: string;
    /**
     * Can be empty string
     */
    channel: string;
    shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: boolean;
    updateId?: string;
    commitTime?: string;
    /**
     * @platform android
     */
    manifestString?: string;
    /**
     * @platform ios
     */
    manifest?: Manifest;
    localAssets?: Record<string, string>;
    reload: () => Promise<void>;
    checkForUpdateAsync: () => Promise<UpdateCheckResultRollBack | (Omit<UpdateCheckResultAvailable, 'manifest'> & ({
        manifestString: string;
    } | {
        manifest: Manifest;
    })) | UpdateCheckResultNotAvailable>;
    getExtraParamsAsync: () => Promise<Record<string, string>>;
    setExtraParamAsync: (key: string, value: string | null) => Promise<void>;
    readLogEntriesAsync: (maxAge: number) => Promise<UpdatesLogEntry[]>;
    clearLogEntriesAsync: () => Promise<void>;
    fetchUpdateAsync: () => Promise<(Omit<UpdateFetchResultSuccess, 'manifest'> & ({
        manifestString: string;
    } | {
        manifest: Manifest;
    })) | UpdateFetchResultFailure | UpdateFetchResultRollBackToEmbedded>;
    getNativeStateMachineContextAsync: () => Promise<UpdatesNativeStateMachineContext & {
        latestManifestString?: string;
        downloadedManifestString?: string;
        lastCheckForUpdateTimeString?: string;
        rollbackString?: string;
    }>;
}
//# sourceMappingURL=ExpoUpdatesModule.types.d.ts.map