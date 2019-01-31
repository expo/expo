import CollectionReference from './CollectionReference';
import DocumentSnapshot from './DocumentSnapshot';
import { Firestore, GetOptions, MetadataChanges, SetOptions } from './firestoreTypes.types';
import Path from './Path';
declare type ObserverOnError = (error: {
    [key: string]: any;
}) => void;
declare type ObserverOnNext = (snapshot: DocumentSnapshot) => void;
declare type Observer = {
    error?: ObserverOnError;
    next: ObserverOnNext;
};
/**
 * @class DocumentReference
 */
export default class DocumentReference {
    _documentPath: Path;
    _firestore: Firestore;
    constructor(firestore: Firestore, documentPath: Path);
    readonly firestore: Firestore;
    readonly id: string | null;
    readonly parent: CollectionReference;
    readonly path: string;
    collection(collectionPath: string): CollectionReference;
    delete(): Promise<void>;
    get(options?: GetOptions): Promise<DocumentSnapshot>;
    onSnapshot(optionsOrObserverOrOnNext: MetadataChanges | Observer | ObserverOnNext, observerOrOnNextOrOnError?: Observer | ObserverOnNext | ObserverOnError, onError?: ObserverOnError): any;
    set(data: Object, options?: SetOptions): Promise<void>;
    update(...args: any[]): Promise<void>;
    /**
     * INTERNALS
     */
    /**
     * Remove document snapshot listener
     * @param listener
     */
    _offDocumentSnapshot(listenerId: string, listener: Function): void;
}
export {};
