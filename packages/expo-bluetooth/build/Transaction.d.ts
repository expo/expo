import { CharacteristicProperty, UUID, TransactionType, TransactionId } from './Bluetooth.types';
declare type PossibleTransaction = TransactionType | CharacteristicProperty;
export declare type TransactionUUIDs = {
    peripheralUUID?: UUID;
    serviceUUID?: UUID;
    characteristicUUID?: UUID;
    descriptorUUID?: UUID;
};
export default class Transaction {
    static fromTransactionId(transactionId: TransactionId): Transaction;
    static generateTransactionId(transactionUUIDs: TransactionUUIDs, type: PossibleTransaction): TransactionId;
    peripheralUUID?: string;
    serviceUUID?: string;
    characteristicUUID?: string;
    descriptorUUID?: string;
    _type?: PossibleTransaction;
    readonly type: PossibleTransaction | undefined;
    constructor({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }: TransactionUUIDs, type?: PossibleTransaction);
    getUUIDs(): TransactionUUIDs;
    setType(type?: PossibleTransaction): void;
    generateId(): TransactionId;
}
export {};
