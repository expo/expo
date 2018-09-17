/**
 * @flow
 * UploadTask representation wrapper
 */
import { statics as StorageStatics } from './index';
import { utils } from 'expo-firebase-app';
import type Storage from './index';
import type StorageReference from './reference';

export const UPLOAD_TASK = 'upload';
export const DOWNLOAD_TASK = 'download';

const { isFunction } = utils;

declare type UploadTaskSnapshotType = {
  bytesTransferred: number,
  downloadURL: string | null,
  metadata: Object, // TODO flow type def for https://firebase.google.com/docs/reference/js/firebase.storage.FullMetadata.html
  ref: StorageReference,
  state:
    | typeof StorageStatics.TaskState.RUNNING
    | typeof StorageStatics.TaskState.PAUSED
    | typeof StorageStatics.TaskState.SUCCESS
    | typeof StorageStatics.TaskState.CANCELLED
    | typeof StorageStatics.TaskState.ERROR,
  task: StorageTask,
  totalBytes: number,
};

declare type FuncSnapshotType = null | ((snapshot: UploadTaskSnapshotType) => any);

declare type FuncErrorType = null | ((error: Error) => any);

declare type NextOrObserverType =
  | null
  | {
      next?: FuncSnapshotType,
      error?: FuncErrorType,
      complete?: FuncSnapshotType,
    }
  | FuncSnapshotType;

/**
 * @url https://firebase.google.com/docs/reference/js/firebase.storage.UploadTask
 */
export default class StorageTask {
  type: typeof UPLOAD_TASK | typeof DOWNLOAD_TASK;
  ref: StorageReference;
  storage: Storage;
  path: string;
  then: () => Promise<*>;
  catch: () => Promise<*>;

  constructor(
    type: typeof UPLOAD_TASK | typeof DOWNLOAD_TASK,
    promise: Promise<*>,
    storageRef: StorageReference
  ) {
    this.type = type;
    this.ref = storageRef;
    this.storage = storageRef._storage;
    this.path = storageRef.path;

    // 'proxy' original promise
    this.then = promise.then.bind(promise);
    this.catch = promise.catch.bind(promise);
  }

  /**
   * Intercepts a native snapshot result object attaches ref / task instances
   * and calls the original function
   * @returns {Promise.<T>}
   * @private
   */
  _interceptSnapshotEvent(f: ?Function): null | (() => *) {
    if (!isFunction(f)) return null;
    return snapshot => {
      const _snapshot = Object.assign({}, snapshot);
      _snapshot.task = this;
      _snapshot.ref = this.ref;
      return f && f(_snapshot);
    };
  }

  /**
   * Intercepts a error object form native and converts to a JS Error
   * @param f
   * @returns {*}
   * @private
   */
  _interceptErrorEvent(f: ?Function): null | (Error => *) {
    if (!isFunction(f)) return null;
    return error => {
      const _error = new Error(error.message);
      // $FlowExpectedError
      _error.code = error.code;
      return f && f(_error);
    };
  }

  /**
   *
   * @param nextOrObserver
   * @param error
   * @param complete
   * @returns {function()}
   * @private
   */
  _subscribe(
    nextOrObserver: NextOrObserverType,
    error: FuncErrorType,
    complete: FuncSnapshotType
  ): Function {
    let _error;
    let _next;
    let _complete;

    if (typeof nextOrObserver === 'function') {
      _error = this._interceptErrorEvent(error);
      _next = this._interceptSnapshotEvent(nextOrObserver);
      _complete = this._interceptSnapshotEvent(complete);
    } else if (nextOrObserver) {
      _error = this._interceptErrorEvent(nextOrObserver.error);
      _next = this._interceptSnapshotEvent(nextOrObserver.next);
      _complete = this._interceptSnapshotEvent(nextOrObserver.complete);
    }

    if (_next) {
      this.storage._addListener(this.path, StorageStatics.TaskEvent.STATE_CHANGED, _next);
    }
    if (_error) {
      this.storage._addListener(this.path, `${this.type}_failure`, _error);
    }
    if (_complete) {
      this.storage._addListener(this.path, `${this.type}_success`, _complete);
    }

    return () => {
      if (_next)
        this.storage._removeListener(this.path, StorageStatics.TaskEvent.STATE_CHANGED, _next);
      if (_error) this.storage._removeListener(this.path, `${this.type}_failure`, _error);
      if (_complete) this.storage._removeListener(this.path, `${this.type}_success`, _complete);
    };
  }

  /**
   *
   * @param event
   * @param nextOrObserver
   * @param error
   * @param complete
   * @returns {function()}
   */
  on(
    event: string = StorageStatics.TaskEvent.STATE_CHANGED,
    nextOrObserver: NextOrObserverType,
    error: FuncErrorType,
    complete: FuncSnapshotType
  ): Function {
    if (!event) {
      throw new Error("StorageTask.on listener is missing required string argument 'event'.");
    }

    if (event !== StorageStatics.TaskEvent.STATE_CHANGED) {
      throw new Error(
        `StorageTask.on event argument must be a string with a value of '${StorageStatics.TaskEvent
          .STATE_CHANGED}'`
      );
    }

    // if only event provided return the subscriber function
    if (!nextOrObserver && !error && !complete) {
      return this._subscribe.bind(this);
    }

    return this._subscribe(nextOrObserver, error, complete);
  }

  pause() {
    throw new Error('.pause() is not currently supported by expo-firebase-storage');
  }

  resume() {
    // todo
    throw new Error('.resume() is not currently supported by expo-firebase-storage');
  }

  cancel() {
    // todo
    throw new Error('.cancel() is not currently supported by expo-firebase-storage');
  }
}
