import * as android from './Android';
export { EVENTS } from './ExpoBluetooth';

export { default as AndroidGATTError } from './errors/AndroidGATTError';
export { default as BluetoothError } from './errors/BluetoothError';
export { default as BluetoothInvariant } from './errors/BluetoothInvariant';
export { default as BluetoothPlatformError } from './errors/BluetoothPlatformError';

export { android };

export * from './Bluetooth';
export * from './Bluetooth.types';

let hasWarned = false;
if (!hasWarned) {
  hasWarned = true;
  console.warn('expo-bluetooth is in very early beta, use at your own discretion!');
}
