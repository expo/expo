import { createTransactionId } from './transactions';
import { CharacteristicProperty, TransactionType } from './Bluetooth.types';
import { DELIMINATOR } from './ExpoBluetooth';
export default class Transaction {
    // Return a Transaction from a transactionId ex: read|some_peripheral_id|some_service_id
    static fromTransactionId(transactionId) {
        let components = transactionId.split(DELIMINATOR);
        let type;
        if (Object.values(CharacteristicProperty).includes(components[0]) ||
            Object.values(TransactionType).includes(components[0])) {
            type = components.shift();
        }
        const [peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID] = components;
        return new Transaction({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }, type);
    }
    static generateTransactionId(transactionUUIDs, type) {
        const transaction = new Transaction(transactionUUIDs, type);
        return transaction.generateId();
    }
    get type() {
        return this._type;
    }
    constructor({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }, type) {
        this.peripheralUUID = peripheralUUID;
        this.serviceUUID = serviceUUID;
        this.characteristicUUID = characteristicUUID;
        this.descriptorUUID = descriptorUUID;
        this._type = type;
    }
    getUUIDs() {
        const { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID } = this;
        return {
            peripheralUUID,
            serviceUUID,
            characteristicUUID,
            descriptorUUID,
        };
    }
    setType(type) {
        this._type = type;
    }
    generateId() {
        const { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID } = this;
        if (this.type === undefined) {
            throw new Error('expo-bluetooth: Transaction.generateId(): type cannot be undefined');
        }
        return createTransactionId({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }, this.type);
    }
}
//# sourceMappingURL=Transaction.js.map