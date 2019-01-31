import DocumentReference from './DocumentReference';
import { Firestore, SetOptions } from './firestoreTypes.types';
declare type DocumentWrite = {
    data?: Object;
    options?: Object;
    path: string;
    type: 'DELETE' | 'SET' | 'UPDATE';
};
/**
 * @class WriteBatch
 */
export default class WriteBatch {
    _firestore: Firestore;
    _writes: DocumentWrite[];
    constructor(firestore: Firestore);
    commit(): Promise<void>;
    delete(docRef: DocumentReference): WriteBatch;
    set(docRef: DocumentReference, data: Object, options?: SetOptions): this;
    update(docRef: DocumentReference, ...args: any[]): WriteBatch;
}
export {};
