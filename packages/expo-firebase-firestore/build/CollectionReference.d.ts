import DocumentReference from './DocumentReference';
import Query from './Query';
import { Firestore, GetOptions, MetadataChanges, QueryDirection, QueryOperator } from './firestoreTypes.types';
import FieldPath from './FieldPath';
import Path from './Path';
import { Observer, ObserverOnError, ObserverOnNext } from './Query';
import QuerySnapshot from './QuerySnapshot';
/**
 * @class CollectionReference
 */
export default class CollectionReference {
    _collectionPath: Path;
    _firestore: Firestore;
    _query: Query;
    constructor(firestore: Firestore, collectionPath: Path);
    readonly firestore: Firestore;
    readonly id: string | null;
    readonly parent: DocumentReference | null;
    add(data: Object): Promise<DocumentReference>;
    doc(documentPath?: string): DocumentReference;
    endAt(...snapshotOrVarArgs: any[]): Query;
    endBefore(...snapshotOrVarArgs: any[]): Query;
    get(options?: GetOptions): Promise<QuerySnapshot>;
    limit(limit: number): Query;
    onSnapshot(optionsOrObserverOrOnNext: MetadataChanges | Observer | ObserverOnNext, observerOrOnNextOrOnError?: Observer | ObserverOnNext | ObserverOnError, onError?: ObserverOnError): () => void;
    orderBy(fieldPath: string | FieldPath, directionStr?: QueryDirection): Query;
    startAfter(...snapshotOrVarArgs: any[]): Query;
    startAt(...snapshotOrVarArgs: any[]): Query;
    where(fieldPath: string, opStr: QueryOperator, value: any): Query;
}
