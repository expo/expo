import { SharedEventEmitter } from 'expo-firebase-app';
let transactionId = 0;
/**
 * Uses the push id generator to create a transaction id
 * @returns {number}
 * @private
 */
const generateTransactionId = () => transactionId++;
/**
 * @class TransactionHandler
 */
export default class TransactionHandler {
    constructor(database) {
        this._transactions = {};
        this._database = database;
        SharedEventEmitter.addListener(this._database.getAppEventName('Expo.Firebase.database_transaction_event'), this._handleTransactionEvent.bind(this));
    }
    /**
     * Add a new transaction and start it natively.
     * @param reference
     * @param transactionUpdater
     * @param onComplete
     * @param applyLocally
     */
    add(reference, transactionUpdater, onComplete, applyLocally = false) {
        const id = generateTransactionId();
        this._transactions[id] = {
            id,
            reference,
            transactionUpdater,
            onComplete,
            applyLocally,
            completed: false,
            started: true,
        };
        this._database.nativeModule.transactionStart(reference.path, id, applyLocally);
    }
    /**
     *  INTERNALS
     */
    /**
     *
     * @param event
     * @returns {*}
     * @private
     */
    _handleTransactionEvent(event = {}) {
        switch (event.type) {
            case 'update':
                return this._handleUpdate(event);
            case 'error':
                return this._handleError(event);
            case 'complete':
                return this._handleComplete(event);
            default:
                this._database.logger.warn(`Unknown transaction event type: '${event.type}'`, event);
                return undefined;
        }
    }
    /**
     *
     * @param event
     * @private
     */
    _handleUpdate(event = {}) {
        let newValue;
        const { id, value } = event;
        try {
            const transaction = this._transactions[id];
            if (!transaction)
                return;
            newValue = transaction.transactionUpdater(value);
        }
        finally {
            let abort = false;
            if (newValue === undefined) {
                abort = true;
            }
            this._database.nativeModule.transactionTryCommit(id, {
                value: newValue,
                abort,
            });
        }
    }
    /**
     *
     * @param event
     * @private
     */
    _handleError(event = {}) {
        const transaction = this._transactions[event.id];
        if (transaction && !transaction.completed) {
            transaction.completed = true;
            try {
                transaction.onComplete(event.error, false, null);
            }
            finally {
                setImmediate(() => {
                    delete this._transactions[event.id];
                });
            }
        }
    }
    /**
     *
     * @param event
     * @private
     */
    _handleComplete(event = {}) {
        const transaction = this._transactions[event.id];
        if (transaction && !transaction.completed) {
            transaction.completed = true;
            try {
                transaction.onComplete(null, event.committed, Object.assign({}, event.snapshot));
            }
            finally {
                setImmediate(() => {
                    delete this._transactions[event.id];
                });
            }
        }
    }
}
//# sourceMappingURL=transaction.js.map