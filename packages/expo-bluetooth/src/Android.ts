import { Subscription } from 'expo-core';

import { Central, NativePeripheral, Priority, UUID } from './Bluetooth.types';
import { EVENTS } from './BluetoothConstants';
import { addHandlerForKey } from './BluetoothEventHandler';
import BluetoothError from './errors/BluetoothError';
import { invariantAvailability, invariantUUID } from './errors/BluetoothInvariant';
import ExpoBluetooth from './ExpoBluetooth';

export async function requestMTUAsync(peripheralUUID: UUID, MTU: number): Promise<number> {
  invariantAvailability('requestMTUAsync');
  invariantUUID(peripheralUUID);
  if (MTU > 512) {
    throw new BluetoothError({ message: 'Max MTU size is 512', code: 'ERR_BLE_MTU' });
  }
  return await ExpoBluetooth.requestMTUAsync(peripheralUUID, MTU);
}
export async function bondAsync(peripheralUUID: UUID): Promise<any> {
  invariantAvailability('bondAsync');
  invariantUUID(peripheralUUID);
  return await ExpoBluetooth.bondAsync(peripheralUUID);
}
export async function unbondAsync(peripheralUUID: UUID): Promise<any> {
  invariantAvailability('unbondAsync');
  invariantUUID(peripheralUUID);
  return await ExpoBluetooth.unbondAsync(peripheralUUID);
}
export async function enableBluetoothAsync(isBluetoothEnabled: boolean = true): Promise<void> {
  invariantAvailability('enableBluetoothAsync');
  return await ExpoBluetooth.enableBluetoothAsync(isBluetoothEnabled);
}
export async function getBondedPeripheralsAsync(): Promise<NativePeripheral[]> {
  invariantAvailability('getBondedPeripheralsAsync');
  return await ExpoBluetooth.getBondedPeripheralsAsync();
}
export async function requestConnectionPriorityAsync(
  peripheralUUID: UUID,
  connectionPriority: Priority
): Promise<void> {
  invariantAvailability('requestConnectionPriorityAsync');
  invariantUUID(peripheralUUID);
  return await ExpoBluetooth.requestConnectionPriorityAsync(peripheralUUID, connectionPriority);
}
export function observeBluetoothEnabled(callback: (updates: Central) => void): Subscription {
  return addHandlerForKey(EVENTS.SYSTEM_ENABLED_STATE_CHANGED!, callback);
}
