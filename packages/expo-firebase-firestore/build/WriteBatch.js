import { parseUpdateArgs } from './utils';
import { buildNativeMap } from './utils/serialize';
/**
 * @class WriteBatch
 */
export default class WriteBatch {
    constructor(firestore) {
        this._firestore = firestore;
        this._writes = [];
    }
    commit() {
        return this._firestore.nativeModule.documentBatch(this._writes);
    }
    delete(docRef) {
        // TODO: Validation
        // validate.isDocumentReference('docRef', docRef);
        // validate.isOptionalPrecondition('deleteOptions', deleteOptions);
        this._writes.push({
            path: docRef.path,
            type: 'DELETE',
        });
        return this;
    }
    set(docRef, data, options) {
        // TODO: Validation
        // validate.isDocumentReference('docRef', docRef);
        // validate.isDocument('data', data);
        // validate.isOptionalPrecondition('options', writeOptions);
        const nativeData = buildNativeMap(data);
        this._writes.push({
            data: nativeData,
            options,
            path: docRef.path,
            type: 'SET',
        });
        return this;
    }
    update(docRef, ...args) {
        // TODO: Validation
        // validate.isDocumentReference('docRef', docRef);
        const data = parseUpdateArgs(args, 'WriteBatch.update');
        this._writes.push({
            data: buildNativeMap(data),
            path: docRef.path,
            type: 'UPDATE',
        });
        return this;
    }
}
//# sourceMappingURL=WriteBatch.js.map