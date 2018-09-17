/**
 * @flow
 * CollectionReference representation wrapper
 */
import DocumentReference from './DocumentReference';
import Query from './Query';
import { utils } from 'expo-firebase-app';
import type Firestore from './';
import type { GetOptions, MetadataChanges, QueryDirection, QueryOperator } from './types';
import type FieldPath from './FieldPath';
import type Path from './Path';
import type { Observer, ObserverOnError, ObserverOnNext } from './Query';
import type QuerySnapshot from './QuerySnapshot';
const { firestoreAutoId } = utils;

/**
 * @class CollectionReference
 */
export default class CollectionReference {
  _collectionPath: Path;

  _firestore: Firestore;

  _query: Query;

  constructor(firestore: Firestore, collectionPath: Path) {
    this._collectionPath = collectionPath;
    this._firestore = firestore;
    this._query = new Query(firestore, collectionPath);
  }

  get firestore(): Firestore {
    return this._firestore;
  }

  get id(): string | null {
    return this._collectionPath.id;
  }

  get parent(): DocumentReference | null {
    const parentPath = this._collectionPath.parent();
    return parentPath ? new DocumentReference(this._firestore, parentPath) : null;
  }

  add(data: Object): Promise<DocumentReference> {
    const documentRef = this.doc();
    return documentRef.set(data).then(() => Promise.resolve(documentRef));
  }

  doc(documentPath?: string): DocumentReference {
    const newPath = documentPath || firestoreAutoId();

    const path = this._collectionPath.child(newPath);
    if (!path.isDocument) {
      throw new Error('Argument "documentPath" must point to a document.');
    }

    return new DocumentReference(this._firestore, path);
  }

  // From Query
  endAt(...snapshotOrVarArgs: any[]): Query {
    return this._query.endAt(snapshotOrVarArgs);
  }

  endBefore(...snapshotOrVarArgs: any[]): Query {
    return this._query.endBefore(snapshotOrVarArgs);
  }

  get(options?: GetOptions): Promise<QuerySnapshot> {
    return this._query.get(options);
  }

  limit(limit: number): Query {
    return this._query.limit(limit);
  }

  onSnapshot(
    optionsOrObserverOrOnNext: MetadataChanges | Observer | ObserverOnNext,
    observerOrOnNextOrOnError?: Observer | ObserverOnNext | ObserverOnError,
    onError?: ObserverOnError
  ): () => void {
    return this._query.onSnapshot(optionsOrObserverOrOnNext, observerOrOnNextOrOnError, onError);
  }

  orderBy(fieldPath: string | FieldPath, directionStr?: QueryDirection): Query {
    return this._query.orderBy(fieldPath, directionStr);
  }

  startAfter(...snapshotOrVarArgs: any[]): Query {
    return this._query.startAfter(snapshotOrVarArgs);
  }

  startAt(...snapshotOrVarArgs: any[]): Query {
    return this._query.startAt(snapshotOrVarArgs);
  }

  where(fieldPath: string, opStr: QueryOperator, value: any): Query {
    return this._query.where(fieldPath, opStr, value);
  }
}
