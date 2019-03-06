import { createOperationId } from './operations';
import { CharacteristicProperty, OperationType } from './Bluetooth.types';
import { DELIMINATOR } from './ExpoBluetooth';
import { BluetoothError } from './errors';
export default class Operation {
    // Return a Operation from a operationId ex: read|some_peripheral_id|some_service_id
    static fromOperationId(operationId) {
        let components = operationId.split(DELIMINATOR);
        let type;
        if (Object.values(CharacteristicProperty).includes(components[0]) ||
            Object.values(OperationType).includes(components[0])) {
            type = components.shift();
        }
        const [peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID] = components;
        return new Operation({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }, type);
    }
    static generateOperationId(operationUUIDs, type) {
        const operation = new Operation(operationUUIDs, type);
        return operation.generateId();
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
            throw new BluetoothError({ code: 'ERR_BLE_ID_GEN', message: 'Operation.generateId(): type cannot be undefined' });
        }
        return createOperationId({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }, this.type);
    }
}
//# sourceMappingURL=Operation.js.map