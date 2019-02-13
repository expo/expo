import { UnavailabilityError } from 'expo-errors';

import ExpoBluetooth from './ExpoBluetooth';
import BluetoothError from './BluetoothError';

export function invariantUUID(uuid: string | undefined) {
  if (uuid == null || typeof uuid !== 'string' || !uuid.length) {
    throw new Error('expo-bluetooth: Invalid UUID provided');
  }
}

export function invariantAvailability(methodName: string) {
  if (!(methodName in ExpoBluetooth) || !(ExpoBluetooth[methodName] instanceof Function)) {
    throw new UnavailabilityError('expo-bluetooth', methodName);
  }
}

export function invariant(should: any, message: string) {
  if (!should) {
    throw new BluetoothError({ message, code: 'ERR_BLE_API_INVARIANT' });
  }
}
