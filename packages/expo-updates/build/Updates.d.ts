import Constants from 'expo-constants';
import { EventSubscription } from 'fbemitter';
export declare enum UpdateEventType {
    UPDATE_AVAILABLE = "updateAvailable",
    NO_UPDATE_AVAILABLE = "noUpdateAvailable",
    ERROR = "error"
}
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
declare type Listener<E> = (event: E) => void;
declare type UpdateEvent = {
    type: UpdateEventType.NO_UPDATE_AVAILABLE;
} | {
    type: UpdateEventType.UPDATE_AVAILABLE;
    manifest: Manifest;
} | {
    type: UpdateEventType.ERROR;
    message: string;
};
declare type LocalAssets = {
    [remoteUrl: string]: string;
};
export declare const localAssets: LocalAssets;
export declare const manifest: Manifest | object;
export declare const isEmergencyLaunch: boolean;
export declare function reloadAsync(): Promise<void>;
export declare function checkForUpdateAsync(): Promise<UpdateCheckResult>;
export declare function fetchUpdateAsync(): Promise<UpdateFetchResult>;
export declare function addListener(listener: Listener<UpdateEvent>): EventSubscription;
export {};
