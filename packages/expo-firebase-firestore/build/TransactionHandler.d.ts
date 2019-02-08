import Transaction from './Transaction';
import { Firestore } from './firestoreTypes.types';
export declare type TransactionMeta = {
    id: number;
    stack: string[];
    reject: Function;
    resolve: Function;
    transaction?: Transaction;
    updateFunction: (transaction: Transaction) => Promise<any>;
};
declare type TransactionEvent = {
    id: number;
    type: 'update' | 'error' | 'complete';
    error?: {
        code: string;
        message: string;
    };
};
/**
 * @class TransactionHandler
 */
export default class TransactionHandler {
    _firestore: Firestore;
    _pending: {
        [key: number]: {
            meta: TransactionMeta;
            transaction: Transaction;
        };
    };
    constructor(firestore: Firestore);
    /**
     * -------------
     * INTERNAL API
     * -------------
     */
    /**
     * Add a new transaction and start it natively.
     * @param updateFunction
     */
    _add(updateFunction: (transaction: Transaction) => Promise<any>): Promise<any>;
    /**
     * Destroys a local instance of a transaction meta
     *
     * @param id
     * @private
     */
    _remove(id: any): void;
    /**
     * -------------
     *    EVENTS
     * -------------
     */
    /**
     * Handles incoming native transaction events and distributes to correct
     * internal handler by event.type
     *
     * @param event
     * @returns {*}
     * @private
     */
    _handleTransactionEvent(event: TransactionEvent): void;
    /**
     * Handles incoming native transaction update events
     *
     * @param event
     * @private
     */
    _handleUpdate(event: TransactionEvent): Promise<any>;
    /**
     * Handles incoming native transaction error events
     *
     * @param event
     * @private
     */
    _handleError(event: TransactionEvent): void;
    /**
     * Handles incoming native transaction complete events
     *
     * @param event
     * @private
     */
    _handleComplete(event: TransactionEvent): void;
}
export {};
