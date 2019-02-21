import { SharedEventEmitter } from 'expo-firebase-app';
import Transaction from './Transaction';
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
    constructor(firestore) {
        this._pending = {};
        this._firestore = firestore;
        SharedEventEmitter.addListener(this._firestore.getAppEventName('Expo.Firebase.firestore_transaction_event'), this._handleTransactionEvent.bind(this));
    }
    /**
     * -------------
     * INTERNAL API
     * -------------
     */
    /**
     * Add a new transaction and start it natively.
     * @param updateFunction
     */
    _add(updateFunction) {
        const id = generateTransactionId();
        // $FlowExpectedError: Transaction has to be populated
        const stackError = new Error();
        const meta = {
            id,
            // To be replaced later
            resolve() { },
            reject() { },
            updateFunction,
            stack: stackError.stack
                .split('\n')
                .slice(2)
                .join('\n'),
        };
        this._pending[id] = {
            meta,
            transaction: new Transaction(this._firestore, meta),
        };
        // deferred promise
        return new Promise((resolve, reject) => {
            this._firestore.nativeModule.transactionBegin(id);
            meta.resolve = r => {
                resolve(r);
                this._remove(id);
            };
            meta.reject = e => {
                reject(e);
                this._remove(id);
            };
        });
    }
    /**
     * Destroys a local instance of a transaction meta
     *
     * @param id
     * @private
     */
    _remove(id) {
        this._firestore.nativeModule.transactionDispose(id);
        delete this._pending[id];
    }
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
    _handleTransactionEvent(event) {
        // eslint-disable-next-line default-case
        switch (event.type) {
            case 'update':
                this._handleUpdate(event);
                break;
            case 'error':
                this._handleError(event);
                break;
            case 'complete':
                this._handleComplete(event);
                break;
        }
    }
    /**
     * Handles incoming native transaction update events
     *
     * @param event
     * @private
     */
    async _handleUpdate(event) {
        const { id } = event;
        // abort if no longer exists js side
        if (!this._pending[id])
            return this._remove(id);
        const { meta, transaction } = this._pending[id];
        const { updateFunction } = meta;
        const reject = meta.reject;
        // clear any saved state from previous transaction runs
        transaction._prepare();
        let finalError;
        let updateFailed;
        let pendingResult;
        // run the users custom update functionality
        try {
            const possiblePromise = updateFunction(transaction);
            // validate user has returned a promise in their update function
            // TODO must it actually return a promise? Can't find any usages of it without one...
            if (!possiblePromise || !possiblePromise.then) {
                finalError = new Error('Update function for `firestore.runTransaction(updateFunction)` must return a Promise.');
            }
            else {
                pendingResult = await possiblePromise;
            }
        }
        catch (exception) {
            // exception can still be falsey if user `Promise.reject();` 's with no args
            // so we track the exception with a updateFailed boolean to ensure no fall-through
            updateFailed = true;
            finalError = exception;
        }
        // reject the final promise and remove from native
        // update is failed when either the users updateFunction
        // throws an error or rejects a promise
        if (updateFailed || finalError) {
            // $FlowExpectedError: Reject will always be present
            return reject(finalError);
        }
        // capture the resolved result as we'll need this
        // to resolve the runTransaction() promise when
        // native emits that the transaction is final
        transaction._pendingResult = pendingResult;
        // send the buffered update/set/delete commands for native to process
        return this._firestore.nativeModule.transactionApplyBuffer(id, transaction._commandBuffer);
    }
    /**
     * Handles incoming native transaction error events
     *
     * @param event
     * @private
     */
    _handleError(event) {
        const { id, error } = event;
        const meta = this._pending[id].meta;
        if (meta && error) {
            const { code, message } = error;
            // build a JS error and replace its stack
            // with the captured one at start of transaction
            // so it's actually relevant to the user
            const errorWithStack = new Error(message);
            // $FlowExpectedError: code is needed for Firebase errors
            errorWithStack.code = code;
            // $FlowExpectedError: stack should be a stack trace
            errorWithStack.stack = `Error: ${message}\n${meta.stack}`;
            // $FlowExpectedError: Reject will always be present
            meta.reject(errorWithStack);
        }
    }
    /**
     * Handles incoming native transaction complete events
     *
     * @param event
     * @private
     */
    _handleComplete(event) {
        const { id } = event;
        const { meta, transaction } = this._pending[id];
        if (meta) {
            const pendingResult = transaction._pendingResult;
            // $FlowExpectedError: Resolve will always be present
            meta.resolve(pendingResult);
        }
    }
}
//# sourceMappingURL=TransactionHandler.js.map