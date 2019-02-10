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

export function fireSingleEventHandlers(
  event: string,
  { central, peripheral }: { central?: Central | null; peripheral?: NativePeripheral | null }
) {
  ensureKey(event);
  for (const callback of multiEventHandlers[event]) {
    callback({ central, peripheral });
  }
  resetHandlersForKey(event);
}

export function fireMultiEventHandlers(
  event: string,
  { central, peripheral }: { central?: Central | null; peripheral?: NativePeripheral | null }
) {
  ensureKey(event);
  for (const callback of multiEventHandlers[event]) {
    callback({ central, peripheral });
  }
}

function ensureKey(key) {
  if (!(key in multiEventHandlers)) {
    multiEventHandlers[key] = [];
  }
}

export async function resetHandlersForKey(key) {
  ensureKey(key);

  let promises: any[] = [];
  for (const listener of multiEventHandlers[key]) {
    if (listener.remove instanceof Function) {
      promises.push(listener.remove());
    }
  }
  multiEventHandlers[key] = [];
  return await Promise.all(promises);
}

export async function _resetAllHandlers() {
  for (const key of Object.keys(multiEventHandlers)) {
    await resetHandlersForKey(key);
  }
}

export function addHandlerForKey(key: string, callback: (updates: any) => void): Subscription {
  ensureKey(key);
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

export function addHandlerForID(
  key: string,
  id: string,
  callback: (updates: any) => void
): Subscription {
  const _key = `${key}_${id}`;
  ensureKey(_key);
  multiEventHandlers[_key].push(callback);

  return {
    remove() {
      const index = multiEventHandlers[_key].indexOf(callback);
      if (index != -1) {
        multiEventHandlers[_key].splice(index, 1);
      }
    },
  };
}

export function getHandlersForKey(key) {
  ensureKey(key);
  return multiEventHandlers[key];
}

export function addListener(listener: (event: any) => void): Subscription {
  // eventEmitter.removeAllListeners(BLUETOOTH_EVENT);
  console.log('EXBLUE_INTERNAL: listener count: ', eventEmitter._listenerCount);
  return eventEmitter.addListener(BLUETOOTH_EVENT, listener);
}

// TODO: Bacon: How do we plan on calling this...
export function removeAllListeners(): void {
  eventEmitter.removeAllListeners(BLUETOOTH_EVENT);
}
