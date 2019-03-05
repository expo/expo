import {
  CharacteristicProperty,
  TransactionHandler,
  TransactionId,
  TransactionType,
} from './Bluetooth.types';
import { DELIMINATOR } from './ExpoBluetooth';
// TODO: this is a cycle
import Transaction from './Transaction';

let transactions: { [transactionId: string]: TransactionHandler } = {};

export function ensureCallbacksArrayForTransactionId(transactionId) {
  if (!(transactionId in transactions) || !Array.isArray(transactions[transactionId].callbacks)) {
    transactions[transactionId] = { callbacks: [] };
  }
}

export function addCallbackForTransactionId(callback, transactionId) {
  ensureCallbacksArrayForTransactionId(transactionId);
  transactions[transactionId].callbacks.push(callback);
}

export function removeCallbackForTransactionId(callback, transactionId) {
  ensureCallbacksArrayForTransactionId(transactionId);

  const index = transactions[transactionId].callbacks.indexOf(callback);

  if (index != -1) {
    transactions[transactionId].callbacks.splice(index, 1);

    if (transactions[transactionId].callbacks.length === 0) {
      delete transactions[transactionId];
    }
  }
}

// Interactions
export function createTransactionId(
  options: {
    peripheralUUID?: string;
    serviceUUID?: string;
    characteristicUUID?: string;
    descriptorUUID?: string;
  },
  transactionType: TransactionType | CharacteristicProperty
): string {
  let targets: string[] = [transactionType];

  if (options.peripheralUUID !== undefined) {
    targets.push(options.peripheralUUID);
    if (options.serviceUUID !== undefined) {
      targets.push(options.serviceUUID);
      if (options.characteristicUUID !== undefined) {
        targets.push(options.characteristicUUID);
        if (options.descriptorUUID !== undefined) {
          targets.push(options.descriptorUUID);
        }
      }
    }
  }
  return targets.join(DELIMINATOR);
}

export function peripheralIdFromId(id: string): string {
  return id.split(DELIMINATOR)[0];
}

export function addTransaction(transaction: Transaction, transactionHandler: TransactionHandler) {
  return addTransactionForId(transaction.generateId(), transactionHandler);
}

export function addTransactionForId(
  transactionId: TransactionId,
  transactionHandler: TransactionHandler
) {
  transactions[transactionId] = transactionHandler;
}

export function deleteTransactionForId(transactionId: TransactionId) {
  if (transactionId in transactions) {
    delete transactions[transactionId];
  }
}

export function getTransactionForId(transactionId: TransactionId): TransactionHandler | undefined {
  return transactions[transactionId];
}

export function getTransactions(): { [transactionId: string]: TransactionHandler } {
  return transactions;
}
