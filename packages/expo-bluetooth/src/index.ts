import * as android from './Android';
import { BLUETOOTH_EVENT, CONNECT_PERIPHERAL_OPTIONS, EVENTS } from './BluetoothConstants';

export { default as AndroidGATTError } from './errors/AndroidGATTError';
export { default as BluetoothError } from './errors/BluetoothError';
export { default as BluetoothInvariant } from './errors/BluetoothInvariant';
export { default as BluetoothPlatformError } from './errors/BluetoothPlatformError';

export { android };

export * from './Bluetooth';
export * from './Bluetooth.types';

export { CONNECT_PERIPHERAL_OPTIONS, BLUETOOTH_EVENT, EVENTS };

let hasWarned = false;
if (!hasWarned) {
  hasWarned = true;
  console.warn('expo-bluetooth is in very early beta, use at your own discretion!');
}
