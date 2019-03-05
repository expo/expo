import { EVENTS } from './BluetoothConstants';
import { addHandlerForKey } from './BluetoothEventHandler';
import BluetoothError from './errors/BluetoothError';
import { invariantAvailability, invariantUUID } from './errors/BluetoothInvariant';
import ExpoBluetooth from './ExpoBluetooth';
export async function requestMTUAsync(peripheralUUID, MTU) {
    invariantAvailability('requestMTUAsync');
    invariantUUID(peripheralUUID);
    if (MTU > 512 || MTU < 0) {
        throw new BluetoothError({ message: 'Max MTU size is 512', code: 'ERR_BLE_MTU' });
    }
    return await ExpoBluetooth.requestMTUAsync(peripheralUUID, MTU);
}
export async function bondAsync(peripheralUUID) {
    invariantAvailability('bondAsync');
    invariantUUID(peripheralUUID);
    return await ExpoBluetooth.bondAsync(peripheralUUID);
}
export async function unbondAsync(peripheralUUID) {
    invariantAvailability('unbondAsync');
    invariantUUID(peripheralUUID);
    return await ExpoBluetooth.unbondAsync(peripheralUUID);
}
export async function enableBluetoothAsync(isBluetoothEnabled = true) {
    invariantAvailability('enableBluetoothAsync');
    return await ExpoBluetooth.enableBluetoothAsync(isBluetoothEnabled);
}
export async function getBondedPeripheralsAsync() {
    invariantAvailability('getBondedPeripheralsAsync');
    return await ExpoBluetooth.getBondedPeripheralsAsync();
}
export async function requestConnectionPriorityAsync(peripheralUUID, connectionPriority) {
    invariantAvailability('requestConnectionPriorityAsync');
    invariantUUID(peripheralUUID);
    return await ExpoBluetooth.requestConnectionPriorityAsync(peripheralUUID, connectionPriority);
}
export function observeBluetoothEnabled(callback) {
    return addHandlerForKey(EVENTS.SYSTEM_ENABLED_STATE_CHANGED, callback);
}
//# sourceMappingURL=Android.js.map