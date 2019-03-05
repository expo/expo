import { DELIMINATOR } from './ExpoBluetooth';
let transactions = {};
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
export function createTransactionId(options, transactionType) {
    let targets = [transactionType];
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
export function peripheralIdFromId(id) {
    return id.split(DELIMINATOR)[0];
}
export function addTransaction(transaction, transactionHandler) {
    return addTransactionForId(transaction.generateId(), transactionHandler);
}
export function addTransactionForId(transactionId, transactionHandler) {
    transactions[transactionId] = transactionHandler;
}
export function deleteTransactionForId(transactionId) {
    if (transactionId in transactions) {
        delete transactions[transactionId];
    }
}
export function getTransactionForId(transactionId) {
    return transactions[transactionId];
}
export function getTransactions() {
    return transactions;
}
//# sourceMappingURL=transactions.js.map