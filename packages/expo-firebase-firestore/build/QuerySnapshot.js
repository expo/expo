import DocumentChange from './DocumentChange';
import DocumentSnapshot from './DocumentSnapshot';
/**
 * @class QuerySnapshot
 */
export default class QuerySnapshot {
    constructor(firestore, query, nativeData) {
        this._changes = nativeData.changes.map(change => new DocumentChange(firestore, change));
        this._docs = nativeData.documents.map(doc => new DocumentSnapshot(firestore, doc));
        this._metadata = nativeData.metadata;
        this._query = query;
    }
    get docChanges() {
        return this._changes;
    }
    get docs() {
        return this._docs;
    }
    get empty() {
        return this._docs.length === 0;
    }
    get metadata() {
        return this._metadata;
    }
    get query() {
        return this._query;
    }
    get size() {
        return this._docs.length;
    }
    forEach(callback) {
        // TODO: Validation
        // validate.isFunction('callback', callback);
        this._docs.forEach(doc => {
            callback(doc);
        });
    }
}
//# sourceMappingURL=QuerySnapshot.js.map