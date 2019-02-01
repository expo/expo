declare type Database = {
    [key: string]: any;
};
/**
 * @class TransactionHandler
 */
export default class TransactionHandler {
    _database: Database;
    _transactions: {
        [id: number]: any;
    };
    constructor(database: Database);
    /**
     * Add a new transaction and start it natively.
     * @param reference
     * @param transactionUpdater
     * @param onComplete
     * @param applyLocally
     */
    add(reference: any, transactionUpdater: Function, onComplete?: Function, applyLocally?: boolean): void;
    /**
     *  INTERNALS
     */
    /**
     *
     * @param event
     * @returns {*}
     * @private
     */
    _handleTransactionEvent(event?: {
        [key: string]: any;
    }): void;
    /**
     *
     * @param event
     * @private
     */
    _handleUpdate(event?: {
        [key: string]: any;
    }): void;
    /**
     *
     * @param event
     * @private
     */
    _handleError(event?: {
        [key: string]: any;
    }): void;
    /**
     *
     * @param event
     * @private
     */
    _handleComplete(event?: {
        [key: string]: any;
    }): void;
}
export {};
