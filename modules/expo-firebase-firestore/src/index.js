/**
 * @flow
 * Firestore representation wrapper
 */
import { NativeModulesProxy } from 'expo-core';
import { events, ModuleBase, utils, getNativeModule, registerModule } from 'expo-firebase-app';
import CollectionReference from './CollectionReference';
import DocumentReference from './DocumentReference';
import FieldPath from './FieldPath';
import FieldValue from './FieldValue';
import GeoPoint from './GeoPoint';
import Blob from './Blob';
import Path from './Path';
import WriteBatch from './WriteBatch';
import TransactionHandler from './TransactionHandler';
import Transaction from './Transaction';

import type DocumentSnapshot from './DocumentSnapshot';
import type { App } from 'expo-firebase-app';
import type QuerySnapshot from './QuerySnapshot';

type CollectionSyncEvent = {
  appName: string,
  querySnapshot?: QuerySnapshot,
  error?: Object,
  listenerId: string,
  path: string,
};

type DocumentSyncEvent = {
  appName: string,
  documentSnapshot?: DocumentSnapshot,
  error?: Object,
  listenerId: string,
  path: string,
};

type Settings = {
  host?: string,
  persistence?: boolean,
  ssl?: boolean,
  timestampsInSnapshots?: boolean,
};

const { getAppEventName, SharedEventEmitter } = events;
const { isBoolean, isObject, isString, hop } = utils;

const NATIVE_EVENTS = [
  'firestore_transaction_event',
  'firestore_document_sync_event',
  'firestore_collection_sync_event',
];

const LogLevels = ['debug', 'error', 'silent'];

export const MODULE_NAME = 'ExpoFirebaseFirestore';
export const NAMESPACE = 'firestore';

export const statics = {
  Blob,
  FieldPath,
  FieldValue,
  GeoPoint,
  enableLogging(enabled: boolean): void {
    // DEPRECATED: Remove method in v4.1.0
    console.warn(
      'firebase.firestore.enableLogging is deprecated, use firebase.firestore().setLogLevel instead.'
    );
    this.setLogLevel(enabled ? 'debug' : 'silent');
  },
  setLogLevel(logLevel: 'debug' | 'error' | 'silent'): void {
    if (LogLevels.indexOf(logLevel) === -1) {
      throw new Error('Argument `logLevel` must be one of: `debug`, `error`, `silent`');
    }
    if (NativeModulesProxy[MODULE_NAME]) {
      NativeModulesProxy[MODULE_NAME].setLogLevel(logLevel);
    }
  },
};

/**
 * @class Firestore
 */
export default class Firestore extends ModuleBase {
  static moduleName = MODULE_NAME;
  static namespace = NAMESPACE;
  static statics = statics;

  _referencePath: Path;
  _transactionHandler: TransactionHandler;

  constructor(app: App) {
    super(app, {
      events: NATIVE_EVENTS,
      moduleName: MODULE_NAME,
      multiApp: true,
      hasShards: false,
      namespace: NAMESPACE,
    });

    this._referencePath = new Path([]);
    this._transactionHandler = new TransactionHandler(this);

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onCollectionSnapshot
      getAppEventName(this, 'firestore_collection_sync_event'),
      this._onCollectionSyncEvent.bind(this)
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onDocumentSnapshot
      getAppEventName(this, 'firestore_document_sync_event'),
      this._onDocumentSyncEvent.bind(this)
    );
  }

  /**
   * -------------
   *  PUBLIC API
   * -------------
   */

  /**
   * Creates a write batch, used for performing multiple writes as a single atomic operation.
   *
   * @returns {WriteBatch}
   */
  batch(): WriteBatch {
    return new WriteBatch(this);
  }

  /**
   * Gets a CollectionReference instance that refers to the collection at the specified path.
   *
   * @param collectionPath
   * @returns {CollectionReference}
   */
  collection(collectionPath: string): CollectionReference {
    const path = this._referencePath.child(collectionPath);
    if (!path.isCollection) {
      throw new Error('Argument "collectionPath" must point to a collection.');
    }

    return new CollectionReference(this, path);
  }

  disableNetwork(): void {
    return getNativeModule(this).disableNetwork();
  }

  /**
   * Gets a DocumentReference instance that refers to the document at the specified path.
   *
   * @param documentPath
   * @returns {DocumentReference}
   */
  doc(documentPath: string): DocumentReference {
    const path = this._referencePath.child(documentPath);
    if (!path.isDocument) {
      throw new Error('Argument "documentPath" must point to a document.');
    }

    return new DocumentReference(this, path);
  }

  enableNetwork(): Promise<void> {
    return getNativeModule(this).enableNetwork();
  }

  /**
   * Executes the given updateFunction and then attempts to commit the
   * changes applied within the transaction. If any document read within
   * the transaction has changed, Cloud Firestore retries the updateFunction.
   *
   * If it fails to commit after 5 attempts, the transaction fails.
   *
   * @param updateFunction
   * @returns {void|Promise<any>}
   */
  runTransaction(updateFunction: (transaction: Transaction) => Promise<any>): Promise<any> {
    return this._transactionHandler._add(updateFunction);
  }

  settings(settings: Settings): Promise<void> {
    if (!isObject(settings)) {
      return Promise.reject(new Error('Firestore.settings failed: settings must be an object.'));
    } else if (hop(settings, 'host') && !isString(settings.host)) {
      return Promise.reject(
        new Error('Firestore.settings failed: settings.host must be a string.')
      );
    } else if (hop(settings, 'persistence') && !isBoolean(settings.persistence)) {
      return Promise.reject(
        new Error('Firestore.settings failed: settings.persistence must be boolean.')
      );
    } else if (hop(settings, 'ssl') && !isBoolean(settings.ssl)) {
      return Promise.reject(new Error('Firestore.settings failed: settings.ssl must be boolean.'));
    } else if (
      hop(settings, 'timestampsInSnapshots') &&
      !isBoolean(settings.timestampsInSnapshots)
    ) {
      return Promise.reject(
        new Error('Firestore.settings failed: settings.timestampsInSnapshots must be boolean.')
      );
    }
    return getNativeModule(this).settings(settings);
  }

  /**
   * -------------
   *  UNSUPPORTED
   * -------------
   */

  enablePersistence(): Promise<void> {
    console.warn(
      'Due to restrictions in the native SDK, persistence must be configured in firebase.firestore().settings()'
    );
    return Promise.resolve();
  }

  /**
   * -------------
   *   INTERNALS
   * -------------
   */

  /**
   * Internal collection sync listener
   *
   * @param event
   * @private
   */
  _onCollectionSyncEvent(event: CollectionSyncEvent) {
    if (event.error) {
      SharedEventEmitter.emit(
        getAppEventName(this, `onQuerySnapshotError:${event.listenerId}`),
        event.error
      );
    } else {
      SharedEventEmitter.emit(
        getAppEventName(this, `onQuerySnapshot:${event.listenerId}`),
        event.querySnapshot
      );
    }
  }

  /**
   * Internal document sync listener
   *
   * @param event
   * @private
   */
  _onDocumentSyncEvent(event: DocumentSyncEvent) {
    if (event.error) {
      SharedEventEmitter.emit(
        getAppEventName(this, `onDocumentSnapshotError:${event.listenerId}`),
        event.error
      );
    } else {
      SharedEventEmitter.emit(
        getAppEventName(this, `onDocumentSnapshot:${event.listenerId}`),
        event.documentSnapshot
      );
    }
  }
}

registerModule(Firestore);

export {
  CollectionReference,
  DocumentReference,
  FieldPath,
  FieldValue,
  GeoPoint,
  Blob,
  Path,
  WriteBatch,
  TransactionHandler,
  Transaction,
};
export { default as DocumentSnapshot } from './DocumentSnapshot';
export { default as DocumentChange } from './DocumentChange';
export { default as Query } from './Query';
export { default as QuerySnapshot } from './QuerySnapshot';
