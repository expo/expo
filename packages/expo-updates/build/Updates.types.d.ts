import Constants from 'expo-constants';
export declare enum UpdateEventType {
    UPDATE_AVAILABLE = "updateAvailable",
    NO_UPDATE_AVAILABLE = "noUpdateAvailable",
    ERROR = "error"
}
export declare type Manifest = typeof Constants.manifest;
export declare type UpdateCheckResult = {
    isAvailable: false;
} | {
    isAvailable: true;
    manifest: Manifest;
};
export declare type UpdateFetchResult = {
    isNew: false;
} | {
    isNew: true;
    manifest: Manifest;
};
export declare type Listener<E> = (event: E) => void;
export declare type UpdateEvent = {
    type: UpdateEventType.NO_UPDATE_AVAILABLE;
} | {
    type: UpdateEventType.UPDATE_AVAILABLE;
    manifest: Manifest;
} | {
    type: UpdateEventType.ERROR;
    message: string;
};
export declare type LocalAssets = {
    [remoteUrl: string]: string;
};
