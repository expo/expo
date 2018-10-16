/**
 * @flow
 * Storage representation wrapper
 */
import { NativeModulesProxy } from 'expo-core';
import {
  events,
  getLogger,
  utils,
  ModuleBase,
  getNativeModule,
  registerModule,
} from 'expo-firebase-app';
import StorageRef from './reference';
import type { App } from 'expo-firebase-app';

const { getAppEventName, SharedEventEmitter } = events;
const { stripTrailingSlash } = utils;

const NATIVE_EVENTS = ['storage_event', 'storage_error'];

export const MODULE_NAME = 'ExpoFirebaseStorage';
export const NAMESPACE = 'storage';

const { [MODULE_NAME]: FirebaseStorage } = NativeModulesProxy;

export const statics = {
  TaskEvent: {
    STATE_CHANGED: 'state_changed',
  },
  TaskState: {
    RUNNING: 'running',
    PAUSED: 'paused',
    SUCCESS: 'success',
    CANCELLED: 'cancelled',
    ERROR: 'error',
  },
  Native: FirebaseStorage
    ? {
        MAIN_BUNDLE_PATH: stripTrailingSlash(FirebaseStorage.MAIN_BUNDLE_PATH),
        CACHES_DIRECTORY_PATH: stripTrailingSlash(FirebaseStorage.CACHES_DIRECTORY_PATH),
        DOCUMENT_DIRECTORY_PATH: stripTrailingSlash(FirebaseStorage.DOCUMENT_DIRECTORY_PATH),
        EXTERNAL_DIRECTORY_PATH: stripTrailingSlash(FirebaseStorage.EXTERNAL_DIRECTORY_PATH),
        EXTERNAL_STORAGE_DIRECTORY_PATH: stripTrailingSlash(
          FirebaseStorage.EXTERNAL_STORAGE_DIRECTORY_PATH
        ),
        TEMP_DIRECTORY_PATH: stripTrailingSlash(FirebaseStorage.TEMP_DIRECTORY_PATH),
        LIBRARY_DIRECTORY_PATH: stripTrailingSlash(FirebaseStorage.LIBRARY_DIRECTORY_PATH),
        FILETYPE_REGULAR: stripTrailingSlash(FirebaseStorage.FILETYPE_REGULAR),
        FILETYPE_DIRECTORY: stripTrailingSlash(FirebaseStorage.FILETYPE_DIRECTORY),
      }
    : {},
};

export default class Storage extends ModuleBase {
  static moduleName = MODULE_NAME;
  static namespace = NAMESPACE;
  static statics = statics;

  /**
   *
   * @param app
   * @param options
   */
  constructor(app: App) {
    super(app, {
      events: NATIVE_EVENTS,
      moduleName: MODULE_NAME,
      multiApp: true,
      hasShards: false,
      namespace: NAMESPACE,
    });

    SharedEventEmitter.addListener(
      getAppEventName(this, 'storage_event'),
      this._handleStorageEvent.bind(this)
    );

    SharedEventEmitter.addListener(
      getAppEventName(this, 'storage_error'),
      this._handleStorageEvent.bind(this)
    );
  }

  /**
   * Returns a reference for the given path in the default bucket.
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#ref
   * @param path
   * @returns {StorageReference}
   */
  ref(path: string): StorageRef {
    return new StorageRef(this, path);
  }

  /**
   * Returns a reference for the given absolute URL.
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#refFromURL
   * @param url
   * @returns {StorageReference}
   */
  refFromURL(url: string): StorageRef {
    // TODO don't think this is correct?
    return new StorageRef(this, `url::${url}`);
  }

  /**
   * setMaxOperationRetryTime
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxOperationRetryTime
   * @param time The new maximum operation retry time in milliseconds.
   */
  setMaxOperationRetryTime(time: number): void {
    getNativeModule(this).setMaxOperationRetryTime(time);
  }

  /**
   * setMaxUploadRetryTime
   * @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxUploadRetryTime
   * @param time The new maximum upload retry time in milliseconds.
   */
  setMaxUploadRetryTime(time: number): void {
    getNativeModule(this).setMaxUploadRetryTime(time);
  }

  /**
   * setMaxDownloadRetryTime
   * @url N/A
   * @param time The new maximum download retry time in milliseconds.
   */
  setMaxDownloadRetryTime(time: number): void {
    getNativeModule(this).setMaxDownloadRetryTime(time);
  }

  /**
   * INTERNALS
   */
  _getSubEventName(path: string, eventName: string) {
    return getAppEventName(this, `${path}-${eventName}`);
  }

  _handleStorageEvent(event: Object) {
    const { path, eventName } = event;
    const body = event.body || {};

    getLogger(this).debug('_handleStorageEvent: ', path, eventName, body);
    SharedEventEmitter.emit(this._getSubEventName(path, eventName), body);
  }

  _handleStorageError(err: Object) {
    const { path, eventName } = err;
    const body = err.body || {};

    getLogger(this).debug('_handleStorageError ->', err);
    SharedEventEmitter.emit(this._getSubEventName(path, eventName), body);
  }

  _addListener(path: string, eventName: string, cb: (evt: Object) => Object): void {
    SharedEventEmitter.addListener(this._getSubEventName(path, eventName), cb);
  }

  _removeListener(path: string, eventName: string, origCB: (evt: Object) => Object): void {
    SharedEventEmitter.removeListener(this._getSubEventName(path, eventName), origCB);
  }
}

registerModule(Storage);


export { default as StorageReference } from './reference';
export {
  StorageRef,
}