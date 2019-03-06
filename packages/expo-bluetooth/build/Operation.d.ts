import { CharacteristicProperty, UUID, OperationType, OperationId } from './Bluetooth.types';
declare type PossibleOperation = OperationType | CharacteristicProperty;
export declare type OperationUUIDs = {
    peripheralUUID?: UUID;
    serviceUUID?: UUID;
    characteristicUUID?: UUID;
    descriptorUUID?: UUID;
};
export default class Operation {
    static fromOperationId(operationId: OperationId): Operation;
    static generateOperationId(operationUUIDs: OperationUUIDs, type: PossibleOperation): OperationId;
    peripheralUUID?: string;
    serviceUUID?: string;
    characteristicUUID?: string;
    descriptorUUID?: string;
    _type?: PossibleOperation;
    readonly type: PossibleOperation | undefined;
    constructor({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }: OperationUUIDs, type?: PossibleOperation);
    getUUIDs(): OperationUUIDs;
    setType(type?: PossibleOperation): void;
    generateId(): OperationId;
}
export {};
