import Constants from 'expo-constants';
declare type Manifest = typeof Constants.manifest;
declare type UpdateEvent = {
    type: 'downloadStart' | 'downloadProgress' | 'noUpdateAvailable';
} | {
    type: 'downloadFinished';
    manifest: Manifest;
} | {
    type: 'error';
    message: string;
};
declare type UpdateCheckResult = {
    isAvailable: false;
} | {
    isAvailable: true;
    manifest: Manifest;
};
declare type UpdateEventListener = (event: UpdateEvent) => void;
export interface UpdatesEventSubscribtion {
    remove: () => void;
}
declare type UpdateFetchResult = {
    isNew: false;
} | {
    isNew: true;
    manifest: Manifest;
};
export declare function checkForUpdateAsync(): Promise<UpdateCheckResult>;
export declare function fetchUpdateAsync({ eventListener, }?: {
    eventListener?: UpdateEventListener;
}): Promise<UpdateFetchResult>;
export declare function reload(): Promise<any>;
export declare function reloadFromCache(): Promise<any>;
export declare function clearUpdateCacheAsync(): Promise<any>;
export declare function readCurrentManifestAsync(): Promise<any>;
export declare function addListener(listener: UpdateEventListener): UpdatesEventSubscribtion;
export declare const EventType: {
    DOWNLOAD_STARTED: string;
    DOWNLOAD_PROGRESS: string;
    DOWNLOAD_FINISHED: string;
    NO_UPDATE_AVAILABLE: string;
    ERROR: string;
};
export {};
