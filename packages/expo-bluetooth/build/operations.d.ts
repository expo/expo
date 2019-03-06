import { CharacteristicProperty, OperationHandler, OperationId, OperationType } from './Bluetooth.types';
import Operation from './Operation';
export declare function ensureCallbacksArrayForOperationId(operationId: any): void;
export declare function addCallbackForOperationId(callback: any, operationId: any): void;
export declare function removeCallbackForOperationId(callback: any, operationId: any): void;
export declare function createOperationId(options: {
    peripheralUUID?: string;
    serviceUUID?: string;
    characteristicUUID?: string;
    descriptorUUID?: string;
}, operationType: OperationType | CharacteristicProperty): string;
export declare function peripheralIdFromId(id: string): string;
export declare function addOperation(operation: Operation, operationHandler: OperationHandler): void;
export declare function addOperationForId(operationId: OperationId, operationHandler: OperationHandler): void;
export declare function deleteOperationForId(operationId: OperationId): void;
export declare function getOperationForId(operationId: OperationId): OperationHandler | undefined;
export declare function getOperations(): {
    [operationId: string]: OperationHandler;
};
