import { Storage, StorageReference, NextOrObserverType, FuncErrorType, FuncSnapshotType } from './index.types';
export declare const UPLOAD_TASK = "upload";
export declare const DOWNLOAD_TASK = "download";
/**
 * @url https://firebase.google.com/docs/reference/js/firebase.storage.UploadTask
 */
export default class StorageTask {
    type: typeof UPLOAD_TASK | typeof DOWNLOAD_TASK;
    ref: StorageReference;
    storage: Storage;
    path: string;
    then: () => Promise<any>;
    catch: () => Promise<any>;
    constructor(type: typeof UPLOAD_TASK | typeof DOWNLOAD_TASK, promise: Promise<any>, storageRef: StorageReference);
    /**
     * Intercepts a native snapshot result object attaches ref / task instances
     * and calls the original function
     * @returns {Promise.<T>}
     * @private
     */
    _interceptSnapshotEvent(f?: Function | null): null | ((snapshot: any) => any);
    /**
     * Intercepts a error object form native and converts to a JS Error
     * @param f
     * @returns {*}
     * @private
     */
    _interceptErrorEvent(f?: Function | null): null | ((error: Error) => any);
    /**
     *
     * @param nextOrObserver
     * @param error
     * @param complete
     * @returns {function()}
     * @private
     */
    _subscribe(nextOrObserver: NextOrObserverType, error: FuncErrorType, complete: FuncSnapshotType): Function;
    /**
     *
     * @param event
     * @param nextOrObserver
     * @param error
     * @param complete
     * @returns {function()}
     */
    on(event: string | undefined, nextOrObserver: NextOrObserverType, error: FuncErrorType, complete: FuncSnapshotType): Function;
    pause(): void;
    resume(): void;
    cancel(): void;
}
