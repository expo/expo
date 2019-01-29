import DocumentChange from './DocumentChange';
import DocumentSnapshot from './DocumentSnapshot';
import { Firestore, NativeDocumentChange, NativeDocumentSnapshot, SnapshotMetadata } from './firestoreTypes.types';
/**
 * @class QuerySnapshot
 */
import Query from './Query';
declare type NativeQuerySnapshot = {
    changes: NativeDocumentChange[];
    documents: NativeDocumentSnapshot[];
    metadata: SnapshotMetadata;
};
/**
 * @class QuerySnapshot
 */
export default class QuerySnapshot {
    _changes: DocumentChange[];
    _docs: DocumentSnapshot[];
    _metadata: SnapshotMetadata;
    _query: Query;
    constructor(firestore: Firestore, query: Query, nativeData: NativeQuerySnapshot);
    readonly docChanges: DocumentChange[];
    readonly docs: DocumentSnapshot[];
    readonly empty: boolean;
    readonly metadata: SnapshotMetadata;
    readonly query: Query;
    readonly size: number;
    forEach(callback: (snapshot: DocumentSnapshot) => any): void;
}
export {};
