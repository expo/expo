import { App, ModuleBase } from 'expo-firebase-app';
import Blob from './Blob';
import CollectionReference from './CollectionReference';
import DocumentReference from './DocumentReference';
import FieldPath from './FieldPath';
import FieldValue from './FieldValue';
import GeoPoint from './GeoPoint';
import Path from './Path';
import Transaction from './Transaction';
import TransactionHandler from './TransactionHandler';
import WriteBatch from './WriteBatch';
import DocumentSnapshot from './DocumentSnapshot';
import QuerySnapshot from './QuerySnapshot';
declare type CollectionSyncEvent = {
    appName: string;
    querySnapshot?: QuerySnapshot;
    error?: Object;
    listenerId: string;
    path: string;
};
declare type DocumentSyncEvent = {
    appName: string;
    documentSnapshot?: DocumentSnapshot;
    error?: Object;
    listenerId: string;
    path: string;
};
declare type Settings = {
    host?: string;
    persistence?: boolean;
    ssl?: boolean;
    timestampsInSnapshots?: boolean;
};
export declare const MODULE_NAME = "ExpoFirebaseFirestore";
export declare const NAMESPACE = "firestore";
export declare const statics: {
    Blob: typeof Blob;
    FieldPath: typeof FieldPath;
    FieldValue: typeof FieldValue;
    GeoPoint: typeof GeoPoint;
    enableLogging(enabled: boolean): void;
    setLogLevel(logLevel: "debug" | "error" | "silent"): void;
};
/**
 * @class Firestore
 */
export default class Firestore extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {
        Blob: typeof Blob;
        FieldPath: typeof FieldPath;
        FieldValue: typeof FieldValue;
        GeoPoint: typeof GeoPoint;
        enableLogging(enabled: boolean): void;
        setLogLevel(logLevel: "debug" | "error" | "silent"): void;
    };
    _referencePath: Path;
    _transactionHandler: TransactionHandler;
    constructor(app: App);
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
    batch(): WriteBatch;
    /**
     * Gets a CollectionReference instance that refers to the collection at the specified path.
     *
     * @param collectionPath
     * @returns {CollectionReference}
     */
    collection(collectionPath: string): CollectionReference;
    disableNetwork(): void;
    /**
     * Gets a DocumentReference instance that refers to the document at the specified path.
     *
     * @param documentPath
     * @returns {DocumentReference}
     */
    doc(documentPath: string): DocumentReference;
    enableNetwork(): Promise<void>;
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
    runTransaction(updateFunction: (transaction: Transaction) => Promise<any>): Promise<any>;
    settings(settings: Settings): Promise<void>;
    /**
     * -------------
     *  UNSUPPORTED
     * -------------
     */
    enablePersistence(): Promise<void>;
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
    _onCollectionSyncEvent(event: CollectionSyncEvent): void;
    /**
     * Internal document sync listener
     *
     * @param event
     * @private
     */
    _onDocumentSyncEvent(event: DocumentSyncEvent): void;
}
export { CollectionReference, DocumentReference, FieldPath, FieldValue, GeoPoint, Blob, Path, WriteBatch, TransactionHandler, Transaction, };
export { default as DocumentSnapshot } from './DocumentSnapshot';
export { default as DocumentChange } from './DocumentChange';
export { default as Query } from './Query';
export { default as QuerySnapshot } from './QuerySnapshot';
export { default as SnapshotError } from './SnapshotError';
