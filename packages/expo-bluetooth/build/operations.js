import { DELIMINATOR } from './ExpoBluetooth';
let operations = {};
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
export function createOperationId(options, operationType) {
    let targets = [operationType];
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
export function addOperation(operation, operationHandler) {
    return addOperationForId(operation.generateId(), operationHandler);
}
export function addOperationForId(operationId, operationHandler) {
    operations[operationId] = operationHandler;
}
export function deleteOperationForId(operationId) {
    if (operationId in operations) {
        delete operations[operationId];
    }
}
export function getOperationForId(operationId) {
    return operations[operationId];
}
export function getOperations() {
    return operations;
}
//# sourceMappingURL=operations.js.map