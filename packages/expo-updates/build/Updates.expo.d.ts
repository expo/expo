import { EventSubscription } from 'fbemitter';
import { Listener, LocalAssets, Manifest, UpdateCheckResult, UpdateEvent, UpdateFetchResult } from './Updates.types';
export * from './Updates.types';
export declare const localAssets: LocalAssets;
export declare const manifest: Manifest | object;
export declare const updateId: string | null;
export declare const releaseChannel: string;
export declare const isEmergencyLaunch: boolean;
export declare const isUsingEmbeddedAssets: boolean;
export declare function reloadAsync(): Promise<void>;
export declare function checkForUpdateAsync(): Promise<UpdateCheckResult>;
export declare function fetchUpdateAsync(): Promise<UpdateFetchResult>;
export declare function clearUpdateCacheExperimentalAsync(sdkVersion?: string): Promise<{
    success: boolean;
    errors: string[];
}>;
export declare function addListener(listener: Listener<UpdateEvent>): EventSubscription;
