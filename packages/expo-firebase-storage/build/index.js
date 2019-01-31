import { ModuleBase, SharedEventEmitter } from 'expo-firebase-app';
import StorageRef from './reference';
import statics from './statics';
const NATIVE_EVENTS = {
    storageEvent: 'Expo.Firebase.storage_event',
    storageError: 'Expo.Firebase.storage_error',
};
export const MODULE_NAME = 'ExpoFirebaseStorage';
export const NAMESPACE = 'storage';
export default class Storage extends ModuleBase {
    /**
     *
     * @param app
     * @param options
     */
    constructor(app) {
        super(app, {
            events: Object.values(NATIVE_EVENTS),
            moduleName: MODULE_NAME,
            hasMultiAppSupport: true,
            hasCustomUrlSupport: false,
            namespace: NAMESPACE,
        });
        SharedEventEmitter.addListener(this.getAppEventName(NATIVE_EVENTS.storageEvent), this._handleStorageEvent.bind(this));
        SharedEventEmitter.addListener(this.getAppEventName(NATIVE_EVENTS.storageError), this._handleStorageEvent.bind(this));
    }
    /**
     * Returns a reference for the given path in the default bucket.
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#ref
     * @param path
     * @returns {StorageReference}
     */
    ref(path) {
        return new StorageRef(this, path);
    }
    /**
     * Returns a reference for the given absolute URL.
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#refFromURL
     * @param url
     * @returns {StorageReference}
     */
    refFromURL(url) {
        // TODO don't think this is correct?
        return new StorageRef(this, `url::${url}`);
    }
    /**
     * setMaxOperationRetryTime
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxOperationRetryTime
     * @param time The new maximum operation retry time in milliseconds.
     */
    setMaxOperationRetryTime(time) {
        this.nativeModule.setMaxOperationRetryTime(time);
    }
    /**
     * setMaxUploadRetryTime
     * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxUploadRetryTime
     * @param time The new maximum upload retry time in milliseconds.
     */
    setMaxUploadRetryTime(time) {
        this.nativeModule.setMaxUploadRetryTime(time);
    }
    /**
     * setMaxDownloadRetryTime
     * @url N/A
     * @param time The new maximum download retry time in milliseconds.
     */
    setMaxDownloadRetryTime(time) {
        this.nativeModule.setMaxDownloadRetryTime(time);
    }
    /**
     * INTERNALS
     */
    _getSubEventName(path, eventName) {
        return this.getAppEventName(`${path}-${eventName}`);
    }
    _handleStorageEvent(event) {
        const { path, eventName } = event;
        const body = event.body || {};
        this.logger.debug('_handleStorageEvent: ', path, eventName, body);
        SharedEventEmitter.emit(this._getSubEventName(path, eventName), body);
    }
    _handleStorageError(err) {
        const { path, eventName } = err;
        const body = err.body || {};
        this.logger.debug('_handleStorageError ->', err);
        SharedEventEmitter.emit(this._getSubEventName(path, eventName), body);
    }
    _addListener(path, eventName, cb) {
        SharedEventEmitter.addListener(this._getSubEventName(path, eventName), cb);
    }
    _removeListener(path, eventName, origCB) {
        SharedEventEmitter.removeListener(this._getSubEventName(path, eventName), origCB);
    }
}
Storage.moduleName = MODULE_NAME;
Storage.namespace = NAMESPACE;
Storage.statics = statics;
export { default as StorageReference } from './reference';
export { StorageRef };
//# sourceMappingURL=index.js.map