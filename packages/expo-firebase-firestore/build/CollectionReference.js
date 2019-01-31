import { utils } from 'expo-firebase-app';
import invariant from 'invariant';
import DocumentReference from './DocumentReference';
import Query from './Query';
const { firestoreAutoId } = utils;
/**
 * @class CollectionReference
 */
export default class CollectionReference {
    constructor(firestore, collectionPath) {
        this._collectionPath = collectionPath;
        this._firestore = firestore;
        this._query = new Query(firestore, collectionPath);
    }
    get firestore() {
        return this._firestore;
    }
    get id() {
        return this._collectionPath.id;
    }
    get parent() {
        const parentPath = this._collectionPath.parent();
        return parentPath ? new DocumentReference(this._firestore, parentPath) : null;
    }
    add(data) {
        const documentRef = this.doc();
        return documentRef.set(data).then(() => Promise.resolve(documentRef));
    }
    doc(documentPath) {
        const newPath = documentPath || firestoreAutoId();
        const path = this._collectionPath.child(newPath);
        invariant(path.isDocument, 'Argument "documentPath" must point to a document.');
        return new DocumentReference(this._firestore, path);
    }
    // From Query
    endAt(...snapshotOrVarArgs) {
        return this._query.endAt(snapshotOrVarArgs);
    }
    endBefore(...snapshotOrVarArgs) {
        return this._query.endBefore(snapshotOrVarArgs);
    }
    get(options) {
        return this._query.get(options);
    }
    limit(limit) {
        return this._query.limit(limit);
    }
    onSnapshot(optionsOrObserverOrOnNext, observerOrOnNextOrOnError, onError) {
        return this._query.onSnapshot(optionsOrObserverOrOnNext, observerOrOnNextOrOnError, onError);
    }
    orderBy(fieldPath, directionStr) {
        return this._query.orderBy(fieldPath, directionStr);
    }
    startAfter(...snapshotOrVarArgs) {
        return this._query.startAfter(snapshotOrVarArgs);
    }
    startAt(...snapshotOrVarArgs) {
        return this._query.startAt(snapshotOrVarArgs);
    }
    where(fieldPath, opStr, value) {
        return this._query.where(fieldPath, opStr, value);
    }
}
//# sourceMappingURL=CollectionReference.js.map