import { NativeModule } from 'expo-modules-core';
import { UpdatesCheckAutomaticallyNativeValue, UpdatesEvents, UpdatesModuleInterface } from './ExpoUpdatesModule.types';
import { Manifest, UpdatesNativeStateMachineContext, UpdateCheckResultNotAvailable, UpdatesLogEntry, UpdateFetchResultFailure } from './Updates.types';
declare class ExpoUpdatesModule extends NativeModule<UpdatesEvents> implements UpdatesModuleInterface {
    isEmergencyLaunch: boolean;
    emergencyLaunchReason: string | null;
    launchDuration: number | null;
    isEmbeddedLaunch: boolean;
    isEnabled: boolean;
    isUsingEmbeddedAssets?: boolean | undefined;
    runtimeVersion: string;
    checkAutomatically: UpdatesCheckAutomaticallyNativeValue;
    channel: string;
    shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: boolean;
    updateId?: string | undefined;
    commitTime?: string | undefined;
    manifestString?: string | undefined;
    manifest?: Manifest | undefined;
    localAssets?: Record<string, string> | undefined;
    initialContext: UpdatesNativeStateMachineContext & {
        latestManifestString?: string | undefined;
        downloadedManifestString?: string | undefined;
        lastCheckForUpdateTimeString?: string | undefined;
        rollbackString?: string | undefined;
    };
    reload(): Promise<void>;
    checkForUpdateAsync(): Promise<UpdateCheckResultNotAvailable>;
    getExtraParamsAsync(): Promise<Record<string, string>>;
    setExtraParamAsync(key: string, value: string | null): Promise<void>;
    readLogEntriesAsync(maxAge: number): Promise<UpdatesLogEntry[]>;
    clearLogEntriesAsync(): Promise<void>;
    fetchUpdateAsync(): Promise<UpdateFetchResultFailure>;
}
declare const _default: typeof ExpoUpdatesModule;
export default _default;
//# sourceMappingURL=ExpoUpdates.web.d.ts.map