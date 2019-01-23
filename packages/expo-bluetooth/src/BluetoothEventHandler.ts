import { EventEmitter, Subscription } from 'expo-core';

import { Central, NativePeripheral } from './Bluetooth.types';
import { BLUETOOTH_EVENT, EVENTS } from './BluetoothConstants';
import { getPeripherals } from './BluetoothLocalState';
import ExpoBluetooth from './ExpoBluetooth';

const eventEmitter = new EventEmitter(ExpoBluetooth);

const multiEventHandlers: any = {
  [EVENTS.CENTRAL_DID_DISCOVER_PERIPHERAL]: [],
  [EVENTS.CENTRAL_DID_UPDATE_STATE]: [],
  everything: [],
  centralState: [],
};

export function firePeripheralObservers() {
  for (const subscription of multiEventHandlers.everything) {
    subscription({ peripherals: getPeripherals() });
  }
}

export function fireMultiEventHandlers(
  event: string,
  { central, peripheral }: { central?: Central | null; peripheral?: NativePeripheral | null }
) {
  for (const callback of multiEventHandlers[event]) {
    callback({ central, peripheral });
  }
}

export function resetHandlersForKey(key) {
  multiEventHandlers[key] = [];
}

export function addHandlerForKey(key: string, callback: (updates: any) => void): Subscription {
  multiEventHandlers[key].push(callback);

  return {
    remove() {
      const index = multiEventHandlers[key].indexOf(callback);
      if (index != -1) {
        multiEventHandlers[key].splice(index, 1);
      }
    },
  };
}

export function getHandlersForKey(key) {
  return multiEventHandlers[key];
}

export function addListener(listener: (event: any) => void): Subscription {
  return eventEmitter.addListener(BLUETOOTH_EVENT, listener);
}

// TODO: Bacon: How do we plan on calling this...
export function removeAllListeners(): void {
  eventEmitter.removeAllListeners(BLUETOOTH_EVENT);
}
