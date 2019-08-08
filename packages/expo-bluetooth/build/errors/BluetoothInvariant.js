import { UnavailabilityError } from '@unimodules/core';
import ExpoBluetooth from '../ExpoBluetooth';
import BluetoothError from './BluetoothError';
/**
 * Assert if the UUID isn't a valid string
 */
export function invariantUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') {
        throw new BluetoothError({ message: 'Invalid UUID provided', code: 'ERR_BLE_INVALID_UUID' });
    }
}
/**
 * Assert that the platform supports a provided native method
 */
export function invariantAvailability(methodName) {
    if (!(methodName in ExpoBluetooth) || !(ExpoBluetooth[methodName] instanceof Function)) {
        throw new UnavailabilityError('expo-bluetooth', methodName);
    }
}
export function invariant(should, message) {
    if (!should) {
        throw new BluetoothError({ message, code: 'ERR_BLE_API_INVARIANT' });
    }
}
//# sourceMappingURL=BluetoothInvariant.js.map