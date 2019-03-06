import {
  CharacteristicProperty,
  OperationHandler,
  OperationId,
  OperationType,
} from './Bluetooth.types';
import { DELIMINATOR } from './ExpoBluetooth';
// TODO: this is a cycle
import Operation from './Operation';

let operations: { [operationId: string]: OperationHandler } = {};

export function ensureCallbacksArrayForOperationId(operationId) {
  if (!(operationId in operations) || !Array.isArray(operations[operationId].callbacks)) {
    operations[operationId] = { callbacks: [] };
  }
}

export function addCallbackForOperationId(callback, operationId) {
  ensureCallbacksArrayForOperationId(operationId);
  operations[operationId].callbacks.push(callback);
}

export function removeCallbackForOperationId(callback, operationId) {
  ensureCallbacksArrayForOperationId(operationId);

  const index = operations[operationId].callbacks.indexOf(callback);

  if (index != -1) {
    operations[operationId].callbacks.splice(index, 1);

    if (operations[operationId].callbacks.length === 0) {
      delete operations[operationId];
    }
  }
}

// Interactions
export function createOperationId(
  options: {
    peripheralUUID?: string;
    serviceUUID?: string;
    characteristicUUID?: string;
    descriptorUUID?: string;
  },
  operationType: OperationType | CharacteristicProperty
): string {
  let targets: string[] = [operationType];

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

export function addOperation(operation: Operation, operationHandler: OperationHandler) {
  return addOperationForId(operation.generateId(), operationHandler);
}

export function addOperationForId(
  operationId: OperationId,
  operationHandler: OperationHandler
) {
  operations[operationId] = operationHandler;
}

export function deleteOperationForId(operationId: OperationId) {
  if (operationId in operations) {
    delete operations[operationId];
  }
}

export function getOperationForId(operationId: OperationId): OperationHandler | undefined {
  return operations[operationId];
}

export function getOperations(): { [operationId: string]: OperationHandler } {
  return operations;
}
