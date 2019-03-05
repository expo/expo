import { CharacteristicProperty, TransactionHandler, TransactionId, TransactionType } from './Bluetooth.types';
import Transaction from './Transaction';
export declare function ensureCallbacksArrayForTransactionId(transactionId: any): void;
export declare function addCallbackForTransactionId(callback: any, transactionId: any): void;
export declare function removeCallbackForTransactionId(callback: any, transactionId: any): void;
export declare function createTransactionId(options: {
    peripheralUUID?: string;
    serviceUUID?: string;
    characteristicUUID?: string;
    descriptorUUID?: string;
}, transactionType: TransactionType | CharacteristicProperty): string;
export declare function peripheralIdFromId(id: string): string;
export declare function addTransaction(transaction: Transaction, transactionHandler: TransactionHandler): void;
export declare function addTransactionForId(transactionId: TransactionId, transactionHandler: TransactionHandler): void;
export declare function deleteTransactionForId(transactionId: TransactionId): void;
export declare function getTransactionForId(transactionId: TransactionId): TransactionHandler | undefined;
export declare function getTransactions(): {
    [transactionId: string]: TransactionHandler;
};
