import Constants from 'expo-constants';
import { EventSubscription } from 'fbemitter';
declare type Manifest = typeof Constants.manifest;
declare type UpdateCheckResult = {
    isAvailable: false;
} | {
    isAvailable: true;
    manifest: Manifest;
};
declare type UpdateFetchResult = {
    isNew: false;
} | {
    isNew: true;
    manifest: Manifest;
};
declare type UpdateEvent = {
    type: 'downloadStart' | 'downloadProgress' | 'noUpdateAvailable';
} | {
    type: 'downloadFinished';
    manifest: Manifest;
} | {
    type: 'error';
    message: string;
};
declare type UpdateEventListener = (event: UpdateEvent) => void;
export declare function reload(): Promise<void>;
export declare function reloadFromCache(): Promise<void>;
export declare function checkForUpdateAsync(): Promise<UpdateCheckResult>;
export declare function fetchUpdateAsync({ eventListener, }?: {
    eventListener?: UpdateEventListener;
}): Promise<UpdateFetchResult>;
export declare function clearUpdateCacheExperimentalAsync(abiVersion: string): Promise<void>;
export declare function addListener(listener: Function): EventSubscription;
export declare const EventType: {
    DOWNLOAD_STARTED: string;
    DOWNLOAD_PROGRESS: string;
    DOWNLOAD_FINISHED: string;
    NO_UPDATE_AVAILABLE: string;
    ERROR: string;
};
export {};
