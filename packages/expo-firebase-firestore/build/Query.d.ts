import FieldPath from './FieldPath';
import QuerySnapshot from './QuerySnapshot';
import SnapshotError from './SnapshotError';
import Path from './Path';
import { Firestore, MetadataChanges, QueryDirection, GetOptions, QueryOperator } from './firestoreTypes.types';
declare type NativeFieldPath = {
    elements?: string[];
    string?: string;
    type: 'fieldpath' | 'string';
};
declare type FieldFilter = {
    fieldPath: NativeFieldPath;
    operator: string;
    value: any;
};
declare type FieldOrder = {
    direction: string;
    fieldPath: NativeFieldPath;
};
declare type QueryOptions = {
    endAt?: any[];
    endBefore?: any[];
    limit?: number;
    offset?: number;
    selectFields?: string[];
    startAfter?: any[];
    startAt?: any[];
};
export declare type ObserverOnError = (error: SnapshotError) => void;
export declare type ObserverOnNext = (snapshot: QuerySnapshot) => void;
export declare type Observer = {
    error?: ObserverOnError;
    next: ObserverOnNext;
};
/**
 * @class Query
 */
export default class Query {
    _fieldFilters: FieldFilter[];
    _fieldOrders: FieldOrder[];
    _firestore: Firestore;
    _iid?: number;
    _queryOptions: QueryOptions;
    _referencePath: Path;
    constructor(firestore: Firestore, path: Path, fieldFilters?: FieldFilter[], fieldOrders?: FieldOrder[], queryOptions?: QueryOptions);
    readonly firestore: Firestore;
    endAt(...snapshotOrVarArgs: any[]): Query;
    endBefore(...snapshotOrVarArgs: any[]): Query;
    get(options?: GetOptions): Promise<QuerySnapshot>;
    limit(limit: number): Query;
    onSnapshot(optionsOrObserverOrOnNext: MetadataChanges | Observer | ObserverOnNext, observerOrOnNextOrOnError?: Observer | ObserverOnNext | ObserverOnError, onError?: ObserverOnError): () => void;
    orderBy(fieldPath: string | FieldPath, directionStr?: QueryDirection): Query;
    startAfter(...snapshotOrVarArgs: any[]): Query;
    startAt(...snapshotOrVarArgs: any[]): Query;
    where(fieldPath: string | FieldPath, opStr: QueryOperator, value: any): Query;
    /**
     * INTERNALS
     */
    _buildOrderByOption(snapshotOrVarArgs: any[]): import("./firestoreTypes.types").NativeTypeMap[];
}
export {};
