import { App, ModuleBase } from 'expo-firebase-app';
import StorageRef from './reference';
export declare const MODULE_NAME = "ExpoFirebaseStorage";
export declare const NAMESPACE = "storage";
export default class Storage extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {
        TaskEvent: {
            STATE_CHANGED: string;
        };
        TaskState: {
            RUNNING: string;
            PAUSED: string;
            SUCCESS: string;
            CANCELLED: string;
            ERROR: string;
        };
        Native: {
            MAIN_BUNDLE_PATH: string;
            CACHES_DIRECTORY_PATH: string;
            DOCUMENT_DIRECTORY_PATH: string;
            EXTERNAL_DIRECTORY_PATH: string;
            EXTERNAL_STORAGE_DIRECTORY_PATH: string;
            TEMP_DIRECTORY_PATH: string;
            LIBRARY_DIRECTORY_PATH: string;
            FILETYPE_REGULAR: string;
            FILETYPE_DIRECTORY: string;
        } | {
            MAIN_BUNDLE_PATH?: undefined;
            CACHES_DIRECTORY_PATH?: undefined;
            DOCUMENT_DIRECTORY_PATH?: undefined;
            EXTERNAL_DIRECTORY_PATH?: undefined;
            EXTERNAL_STORAGE_DIRECTORY_PATH?: undefined;
            TEMP_DIRECTORY_PATH?: undefined;
            LIBRARY_DIRECTORY_PATH?: undefined;
            FILETYPE_REGULAR?: undefined;
            FILETYPE_DIRECTORY?: undefined;
        };
    };
    /**
     *
     * @param app
     * @param options
     */
    constructor(app: App);
    /**
     * Returns a reference for the given path in the default bucket.
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#ref
     * @param path
     * @returns {StorageReference}
     */
    ref(path: string): StorageRef;
    /**
     * Returns a reference for the given absolute URL.
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#refFromURL
     * @param url
     * @returns {StorageReference}
     */
    refFromURL(url: string): StorageRef;
    /**
     * setMaxOperationRetryTime
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxOperationRetryTime
     * @param time The new maximum operation retry time in milliseconds.
     */
    setMaxOperationRetryTime(time: number): void;
    /**
     * setMaxUploadRetryTime
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxUploadRetryTime
     * @param time The new maximum upload retry time in milliseconds.
     */
    setMaxUploadRetryTime(time: number): void;
    /**
     * setMaxDownloadRetryTime
     * @url N/A
     * @param time The new maximum download retry time in milliseconds.
     */
    setMaxDownloadRetryTime(time: number): void;
    /**
     * INTERNALS
     */
    _getSubEventName(path: string, eventName: string): string;
    _handleStorageEvent(event: any): void;
    _handleStorageError(err: any): void;
    _addListener(path: string, eventName: string, cb: (evt: any) => any): void;
    _removeListener(path: string, eventName: string, origCB: (evt: any) => any): void;
}
export { default as StorageReference } from './reference';
export { StorageRef };
