/**
 * @flow
 * Database Transaction representation wrapper
 */
import { events, getLogger, getNativeModule } from 'expo-firebase-app';
import type Database from './index';

const { getAppEventName, SharedEventEmitter } = events;

let transactionId = 0;

/**
 * Uses the push id generator to create a transaction id
 * @returns {number}
 * @private
 */
const generateTransactionId = (): number => transactionId++;

/**
 * @class TransactionHandler
 */
export default class TransactionHandler {
  _database: Database;
  _transactions: { [number]: Object };

  constructor(database: Database) {
    this._transactions = {};
    this._database = database;

    SharedEventEmitter.addListener(
      getAppEventName(this._database, 'database_transaction_event'),
      this._handleTransactionEvent.bind(this)
    );
  }

  /**
   * Add a new transaction and start it natively.
   * @param reference
   * @param transactionUpdater
   * @param onComplete
   * @param applyLocally
   */
  add(
    reference: Object,
    transactionUpdater: Function,
    onComplete?: Function,
    applyLocally?: boolean = false
  ) {
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

    getNativeModule(this._database).transactionStart(reference.path, id, applyLocally);
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
  _handleTransactionEvent(event: Object = {}) {
    switch (event.type) {
      case 'update':
        return this._handleUpdate(event);
      case 'error':
        return this._handleError(event);
      case 'complete':
        return this._handleComplete(event);
      default:
        getLogger(this._database).warn(`Unknown transaction event type: '${event.type}'`, event);
        return undefined;
    }
  }

  /**
   *
   * @param event
   * @private
   */
  _handleUpdate(event: Object = {}) {
    let newValue;
    const { id, value } = event;

    try {
      const transaction = this._transactions[id];
      if (!transaction) return;

      newValue = transaction.transactionUpdater(value);
    } finally {
      let abort = false;

      if (newValue === undefined) {
        abort = true;
      }

      getNativeModule(this._database).transactionTryCommit(id, {
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
  _handleError(event: Object = {}) {
    const transaction = this._transactions[event.id];
    if (transaction && !transaction.completed) {
      transaction.completed = true;
      try {
        transaction.onComplete(event.error, false, null);
      } finally {
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
  _handleComplete(event: Object = {}) {
    const transaction = this._transactions[event.id];
    if (transaction && !transaction.completed) {
      transaction.completed = true;
      try {
        transaction.onComplete(null, event.committed, Object.assign({}, event.snapshot));
      } finally {
        setImmediate(() => {
          delete this._transactions[event.id];
        });
      }
    }
  }
}
