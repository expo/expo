import { EventEmitter } from 'expo-core';
import { BLUETOOTH_EVENT } from './BluetoothConstants';
import { getPeripherals } from './BluetoothLocalState';
import ExpoBluetooth from './ExpoBluetooth/ExpoBluetooth';
const eventEmitter = new EventEmitter(ExpoBluetooth);
const multiEventHandlers = {
    everything: [],
    centralState: [],
};
export function firePeripheralObservers() {
    for (const subscription of multiEventHandlers.everything) {
        subscription({ peripherals: getPeripherals() });
    }
}
export function fireSingleEventHandlers(event, { central, peripheral, error, }) {
    fireMultiEventHandlers(event, { central, peripheral, error });
    resetHandlersForKey(event);
}
export function fireMultiEventHandlers(event, { central, peripheral, error, }) {
    ensureKey(event);
    for (const callback of multiEventHandlers[event]) {
        callback({ central, peripheral, error });
    }
}
function ensureKey(key) {
    if (!(key in multiEventHandlers)) {
        multiEventHandlers[key] = [];
    }
}
export async function resetHandlersForKey(key) {
    ensureKey(key);
    let promises = [];
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
export function addHandlerForKey(key, callback) {
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
export function addHandlerForID(key, id, callback) {
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
export function addListener(listener) {
    return eventEmitter.addListener(BLUETOOTH_EVENT, listener);
}
export function removeAllListeners() {
    eventEmitter.removeAllListeners(BLUETOOTH_EVENT);
}
//# sourceMappingURL=BluetoothEventHandler.js.map