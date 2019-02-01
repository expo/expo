import DocumentSnapshot from './DocumentSnapshot';
import { Firestore } from './firestoreTypes.types';
import DocumentReference from './DocumentReference';
declare type TransactionMeta = {
    [key: string]: any;
};
declare type Command = {
    type: 'set' | 'update' | 'delete';
    path: string;
    data?: {
        [key: string]: any;
    };
    options?: SetOptions | {};
};
declare type SetOptions = {
    merge: boolean;
};
/**
 * @class Transaction
 */
export default class Transaction {
    _pendingResult?: any;
    _firestore: Firestore;
    _meta: TransactionMeta;
    _commandBuffer: Array<Command>;
    constructor(firestore: Firestore, meta: TransactionMeta);
    /**
     * -------------
     * INTERNAL API
     * -------------
     */
    /**
     * Clears the command buffer and any pending result in prep for
     * the next transaction iteration attempt.
     *
     * @private
     */
    _prepare(): void;
    /**
     * -------------
     *  PUBLIC API
     * -------------
     */
    /**
     * Reads the document referenced by the provided DocumentReference.
     *
     * @param documentRef DocumentReference A reference to the document to be retrieved. Value must not be null.
     *
     * @returns Promise<DocumentSnapshot>
     */
    get(documentRef: DocumentReference): Promise<DocumentSnapshot>;
    /**
     * Writes to the document referred to by the provided DocumentReference.
     * If the document does not exist yet, it will be created. If you pass options,
     * the provided data can be merged into the existing document.
     *
     * @param documentRef DocumentReference A reference to the document to be created. Value must not be null.
     * @param data Object An object of the fields and values for the document.
     * @param options SetOptions An object to configure the set behavior.
     *        Pass {merge: true} to only replace the values specified in the data argument.
     *        Fields omitted will remain untouched.
     *
     * @returns {Transaction}
     */
    set(documentRef: DocumentReference, data: Object, options?: SetOptions): Transaction;
    /**
     * Updates fields in the document referred to by this DocumentReference.
     * The update will fail if applied to a document that does not exist. Nested
     * fields can be updated by providing dot-separated field path strings or by providing FieldPath objects.
     *
     * @param documentRef DocumentReference A reference to the document to be updated. Value must not be null.
     * @param args any Either an object containing all of the fields and values to update,
     *        or a series of arguments alternating between fields (as string or FieldPath
     *        objects) and values.
     *
     * @returns {Transaction}
     */
    update(documentRef: DocumentReference, ...args: Array<any>): Transaction;
    /**
     * Deletes the document referred to by the provided DocumentReference.
     *
     * @param documentRef DocumentReference A reference to the document to be deleted. Value must not be null.
     *
     * @returns {Transaction}
     */
    delete(documentRef: DocumentReference): Transaction;
}
export {};
