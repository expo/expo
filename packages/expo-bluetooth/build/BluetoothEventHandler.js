import { EventEmitter } from 'expo-core';
import { BLUETOOTH_EVENT, EVENTS } from './BluetoothConstants';
import { getPeripherals } from './BluetoothLocalState';
import ExpoBluetooth from './ExpoBluetooth';
const eventEmitter = new EventEmitter(ExpoBluetooth);
const multiEventHandlers = {
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
export function fireMultiEventHandlers(event, { central, peripheral }) {
    for (const callback of multiEventHandlers[event]) {
        callback({ central, peripheral });
    }
}
export function resetHandlersForKey(key) {
    multiEventHandlers[key] = [];
}
export function addHandlerForKey(key, callback) {
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
export function addListener(listener) {
    return eventEmitter.addListener(BLUETOOTH_EVENT, listener);
}
// TODO: Bacon: How do we plan on calling this...
export function removeAllListeners() {
    eventEmitter.removeAllListeners(BLUETOOTH_EVENT);
}
//# sourceMappingURL=BluetoothEventHandler.js.map