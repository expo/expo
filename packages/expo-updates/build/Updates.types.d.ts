import Constants from 'expo-constants';
export declare enum UpdateEventType {
    /**
     * A new update has finished downloading to local storage. If you would like to start using this
     * update at any point before the user closes and restarts the app on their own, you can call
     * [`Updates.reloadAsync()`](#reloadasync) to launch this new update.
     */
    UPDATE_AVAILABLE = "updateAvailable",
    /**
     * No updates are available, and the most up-to-date bundle of this experience is already running.
     */
    NO_UPDATE_AVAILABLE = "noUpdateAvailable",
    /**
     * An error occurred trying to fetch the latest update.
     */
    ERROR = "error"
}
/**
 * @hidden
 */
export declare type ClassicManifest = typeof Constants.manifest;
/**
 * @hidden
 */
export declare type Manifest = ClassicManifest | typeof Constants.manifest2;
export declare type UpdateCheckResult = {
    /**
     * `true` if an update is available, `false` if you're already running the most up-to-date JS bundle.
     */
    isAvailable: boolean;
    /**
     * If `isAvailable` is `true`, the manifest of the available update. Undefined otherwise.
     */
    manifest?: Manifest;
};
export declare type UpdateFetchResult = {
    /**
     * `true` if the fetched bundle is new (i.e. a different version than what's currently running),
     * `false` otherwise.
     */
    isNew: boolean;
    /**
     * If `isNew` is `true`, the manifest of the newly downloaded update. Undefined otherwise.
     */
    manifest?: Manifest;
};
/**
 * An object that is passed into each event listener when an auto-update check has occurred.
 */
export declare type UpdateEvent = {
    /**
     * Type of the event.
     */
    type: UpdateEventType;
    /**
     * If `type === Updates.UpdateEventType.UPDATE_AVAILABLE`, the manifest of the newly downloaded
     * update. Undefined otherwise.
     */
    manifest?: Manifest;
    /**
     * If `type === Updates.UpdateEventType.ERROR`, the error message. Undefined otherwise.
     */
    message?: string;
};
/**
 * @hidden
 */
export declare type LocalAssets = Record<string, string>;
