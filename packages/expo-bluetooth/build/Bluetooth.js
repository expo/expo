import { CharacteristicProperty, } from './Bluetooth.types';
import { BLUETOOTH_EVENT, DELIMINATOR, EVENTS, TYPES } from './BluetoothConstants';
import { addHandlerForKey, addListener, fireMultiEventHandlers, fireSingleEventHandlers, firePeripheralObservers, addHandlerForID, resetHandlersForKey, _resetAllHandlers, } from './BluetoothEventHandler';
import { invariantAvailability, invariant, invariantUUID } from './BluetoothInvariant';
import { clearPeripherals, getPeripherals, updateStateWithPeripheral } from './BluetoothLocalState';
import { peripheralIdFromId } from './BluetoothTransactions';
import ExpoBluetooth from './ExpoBluetooth';
import Transaction from './Transaction';
import BluetoothError from './BluetoothError';
export * from './Bluetooth.types';
/*
initializeManagerAsync
deallocateManagerAsync

getPeripheralsAsync
getCentralAsync
startScanningAsync
stopScanningAsync
connectPeripheralAsync
readRSSIAsync
readDescriptorAsync
writeDescriptorAsync
writeCharacteristicAsync
readCharacteristicAsync
setNotifyCharacteristicAsync

discoverDescriptorsForCharacteristicAsync
discoverCharacteristicsForServiceAsync
discoverIncludedServicesForServiceAsync
disconnectPeripheralAsync
*/
export { BLUETOOTH_EVENT, TYPES, EVENTS };
/**
 * **iOS:**
 *
 * Although strongly discouraged,
 * if `serviceUUIDsToQuery` is `null | undefined` all discovered peripherals will be returned.
 * If the central is already scanning with different
 * `serviceUUIDsToQuery` or `scanSettings`, the provided parameters will replace them.
 */
export async function startScanningAsync(scanSettings = {}, callback) {
    invariantAvailability('startScanningAsync');
    invariant(callback, 'startScanningAsync({ ... }, null): callback is not defined');
    const { serviceUUIDsToQuery = [], ...scanningOptions } = scanSettings;
    await ExpoBluetooth.startScanningAsync([...new Set(serviceUUIDsToQuery)], scanningOptions);
    const subscription = addHandlerForKey(EVENTS.CENTRAL_DISCOVERED_PERIPHERAL, event => {
        invariant(callback, 'startScanningAsync({ ... }, null): callback is not defined');
        if (!event) {
            throw new Error('UNEXPECTED ' + EVENTS.CENTRAL_DISCOVERED_PERIPHERAL);
        }
        callback(event.peripheral);
    });
    return async () => {
        if (subscription) {
            subscription.remove();
            await stopScanningAsync();
        }
    };
}
export async function stopScanningAsync() {
    invariantAvailability('stopScanningAsync');
    // Remove all callbacks
    await resetHandlersForKey(EVENTS.CENTRAL_DISCOVERED_PERIPHERAL);
    await ExpoBluetooth.stopScanningAsync();
}
// Avoiding using "start" in passive method names
export function observeUpdates(callback) {
    return addHandlerForKey('everything', callback);
}
// export function observeScanningErrors(callback: (updates: any) => void): Subscription {
//   return addHandlerForKey(EVENTS.CENTRAL_SCAN_STOPPED, callback);
// }
export async function observeStateAsync(callback) {
    const central = await getCentralAsync();
    // Make the callback async so the subscription returns first.
    setTimeout(() => callback(central.state));
    return addHandlerForKey(EVENTS.CENTRAL_STATE_CHANGED, ({ central = {} }) => callback(central.state));
}
export async function connectAsync(peripheralUUID, options = {}) {
    invariantAvailability('connectPeripheralAsync');
    invariantUUID(peripheralUUID);
    const { onDisconnect } = options;
    if (onDisconnect) {
        addHandlerForID(EVENTS.PERIPHERAL_DISCONNECTED, peripheralUUID, onDisconnect);
    }
    let timeoutTag;
    return new Promise(async (resolve, reject) => {
        if (options.timeout) {
            timeoutTag = setTimeout(() => {
                disconnectAsync(peripheralUUID);
                reject(new BluetoothError({
                    message: `Failed to connect to peripheral: ${peripheralUUID} in under: ${options.timeout}ms`,
                    code: 'timeout',
                }));
            }, options.timeout);
        }
        try {
            const result = await ExpoBluetooth.connectPeripheralAsync(peripheralUUID, options.options);
            console.log("API:INTERNAL:connectPeripheralAsync.resolved", result);
            clearTimeout(timeoutTag);
            resolve(result);
            return;
        }
        catch (error) {
            console.log("API:INTERNAL:connectPeripheralAsync.rejected", error);
            clearTimeout(timeoutTag);
            reject(error);
            return;
        }
    });
}
/** This method will also cancel pending connections */
export async function disconnectAsync(peripheralUUID) {
    invariantAvailability('disconnectPeripheralAsync');
    invariantUUID(peripheralUUID);
    return await ExpoBluetooth.disconnectPeripheralAsync(peripheralUUID);
}
/* TODO: Bacon: Add a return type */
export async function readDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, }) {
    const { descriptor } = await ExpoBluetooth.readDescriptorAsync({
        peripheralUUID,
        serviceUUID,
        characteristicUUID,
        descriptorUUID,
        characteristicProperties: CharacteristicProperty.Read,
    });
    return descriptor.value;
}
/* TODO: Bacon: Add a return type */
export async function writeDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, data, }) {
    invariantAvailability('writeDescriptorAsync');
    const { descriptor } = await ExpoBluetooth.writeDescriptorAsync({
        peripheralUUID,
        serviceUUID,
        characteristicUUID,
        descriptorUUID,
        data,
        characteristicProperties: CharacteristicProperty.Write,
    });
    return descriptor;
}
export async function setNotifyCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, shouldNotify, }) {
    invariantAvailability('setNotifyCharacteristicAsync');
    const { characteristic } = await ExpoBluetooth.setNotifyCharacteristicAsync({
        peripheralUUID,
        serviceUUID,
        characteristicUUID,
        shouldNotify,
    });
    return characteristic;
}
/* TODO: Bacon: Add a return type */
export async function readCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, }) {
    const { characteristic } = await ExpoBluetooth.readCharacteristicAsync({
        peripheralUUID,
        serviceUUID,
        characteristicUUID,
        characteristicProperties: CharacteristicProperty.Read,
    });
    return characteristic.value;
}
/* TODO: Bacon: Add a return type */
export async function writeCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, data, }) {
    const { characteristic } = await ExpoBluetooth.writeCharacteristicAsync({
        peripheralUUID,
        serviceUUID,
        characteristicUUID,
        data,
        characteristicProperties: CharacteristicProperty.Write,
    });
    return characteristic;
}
/* TODO: Bacon: Why would anyone use this? */
/* TODO: Bacon: Test if this works */
/* TODO: Bacon: Add a return type */
export async function writeCharacteristicWithoutResponseAsync({ peripheralUUID, serviceUUID, characteristicUUID, data, }) {
    const { characteristic } = await ExpoBluetooth.writeCharacteristicAsync({
        peripheralUUID,
        serviceUUID,
        characteristicUUID,
        data,
        characteristicProperties: CharacteristicProperty.WriteWithoutResponse,
    });
    return characteristic;
}
export async function readRSSIAsync(peripheralUUID) {
    invariantAvailability('readRSSIAsync');
    invariantUUID(peripheralUUID);
    return await ExpoBluetooth.readRSSIAsync(peripheralUUID);
}
export async function getPeripheralsAsync() {
    invariantAvailability('getPeripheralsAsync');
    return await ExpoBluetooth.getPeripheralsAsync();
}
export async function getConnectedPeripheralsAsync(serviceUUIDsToQuery = []) {
    invariantAvailability('getConnectedPeripheralsAsync');
    return await ExpoBluetooth.getConnectedPeripheralsAsync(serviceUUIDsToQuery);
}
export async function getCentralAsync() {
    invariantAvailability('getCentralAsync');
    return await ExpoBluetooth.getCentralAsync();
}
export async function getPeripheralAsync({ peripheralUUID }) {
    invariantAvailability('getPeripheralAsync');
    return await ExpoBluetooth.getPeripheralAsync({ peripheralUUID });
}
export async function getServiceAsync({ peripheralUUID, serviceUUID }) {
    invariantAvailability('getServiceAsync');
    return await ExpoBluetooth.getServiceAsync({ peripheralUUID, serviceUUID });
}
export async function getCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, }) {
    invariantAvailability('getCharacteristicAsync');
    return await ExpoBluetooth.getCharacteristicAsync({
        peripheralUUID,
        serviceUUID,
        characteristicUUID,
    });
}
export async function getDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, }) {
    invariantAvailability('getDescriptorAsync');
    return await ExpoBluetooth.getDescriptorAsync({
        peripheralUUID,
        serviceUUID,
        characteristicUUID,
        descriptorUUID,
    });
}
export async function isScanningAsync() {
    const { isScanning, ...props } = await getCentralAsync();
    console.log('central', isScanning, props);
    return isScanning;
}
// TODO: Bacon: Add serviceUUIDs
export async function discoverServicesForPeripheralAsync(options) {
    invariantAvailability('discoverServicesForPeripheralAsync');
    const transaction = Transaction.fromTransactionId(options.id);
    console.log("discoverServicesForPeripheralAsync: Before Native: ", options);
    return await ExpoBluetooth.discoverServicesForPeripheralAsync({
        ...transaction.getUUIDs(),
        serviceUUIDs: options.serviceUUIDs,
        characteristicProperties: options.characteristicProperties,
    });
}
export async function discoverIncludedServicesForServiceAsync(options) {
    invariantAvailability('discoverIncludedServicesForServiceAsync');
    const transaction = Transaction.fromTransactionId(options.id);
    return await ExpoBluetooth.discoverIncludedServicesForServiceAsync({
        ...transaction.getUUIDs(),
        serviceUUIDs: options.serviceUUIDs,
    });
}
export async function discoverCharacteristicsForServiceAsync(options) {
    invariantAvailability('discoverCharacteristicsForServiceAsync');
    const transaction = Transaction.fromTransactionId(options.id);
    return await ExpoBluetooth.discoverCharacteristicsForServiceAsync({
        ...transaction.getUUIDs(),
        serviceUUIDs: options.serviceUUIDs,
        characteristicProperties: options.characteristicProperties,
    });
}
export async function discoverDescriptorsForCharacteristicAsync(options) {
    invariantAvailability('discoverDescriptorsForCharacteristicAsync');
    const transaction = Transaction.fromTransactionId(options.id);
    return await ExpoBluetooth.discoverDescriptorsForCharacteristicAsync({
        ...transaction.getUUIDs(),
        serviceUUIDs: options.serviceUUIDs,
        characteristicProperties: options.characteristicProperties,
    });
    // return await discoverAsync({ id });
}
export async function loadPeripheralAsync({ id }, skipConnecting = false) {
    const peripheralId = peripheralIdFromId(id);
    const peripheral = getPeripherals()[peripheralId];
    if (!peripheral) {
        throw new Error('Not a peripheral ' + peripheralId);
    }
    if (peripheral.state !== 'connected') {
        if (!skipConnecting) {
            const connectedPeripheral = await connectAsync(peripheralId, {
                onDisconnect: (...props) => {
                    console.log('On Disconnect public callback', ...props);
                },
            });
            console.log('loadPeripheralAsync(): connected!');
            return loadPeripheralAsync(connectedPeripheral, true);
        }
        console.log('loadPeripheralAsync(): NEVER CALL', peripheral.state);
        // This should never be called because in theory connectAsync would throw an error.
    }
    else if (peripheral.state === 'connected') {
        console.log('loadPeripheralAsync(): _loadChildrenRecursivelyAsync!');
        await _loadChildrenRecursivelyAsync({ id: peripheralId });
    }
    console.log('loadPeripheralAsync(): fully loaded');
    // In case any updates occured during this function.
    return getPeripherals()[peripheralId];
}
export async function _loadChildrenRecursivelyAsync({ id }) {
    const components = id.split(DELIMINATOR);
    console.log('_loadChildrenRecursivelyAsync(): components', components);
    // console.log({ components });
    if (components.length === 4) {
        // Descriptor ID
        throw new Error('Descriptors have no children');
    }
    else if (components.length === 3) {
        // Characteristic ID
        console.log('Load Characteristic ', id);
        // DEBUG
        // console.warn('DISABLE ME');
        // return [];
        const { characteristic: { descriptors }, } = await discoverDescriptorsForCharacteristicAsync({ id });
        return descriptors;
    }
    else if (components.length === 2) {
        // Service ID
        console.log('Load Service ', id);
        const { service } = await discoverCharacteristicsForServiceAsync({ id });
        console.log('LOADED CHARACTERISTICS FROM SERVICE', service);
        return await Promise.all(service.characteristics.map(characteristic => _loadChildrenRecursivelyAsync(characteristic)));
    }
    else if (components.length === 1) {
        // Peripheral ID
        console.log('Load Peripheral ', id);
        const { peripheral: { services }, } = await discoverServicesForPeripheralAsync({ id });
        console.log('discoverServicesForPeripheralAsync(): ', services);
        return await Promise.all(services.map(service => _loadChildrenRecursivelyAsync(service)));
    }
    else {
        throw new Error(`Unknown ID ${id}`);
    }
}
const android = {
    async requestMTUAsync(peripheralUUID, MTU) {
        invariantAvailability('requestMTUAsync');
        invariantUUID(peripheralUUID);
        if (MTU > 512) {
            throw new Error('expo-bluetooth: Max MTU size is 512');
        }
        return await ExpoBluetooth.requestMTUAsync(peripheralUUID, MTU);
    },
    async bondAsync(peripheralUUID) {
        invariantAvailability('bondAsync');
        invariantUUID(peripheralUUID);
        return await ExpoBluetooth.bondAsync(peripheralUUID);
    },
    async unbondAsync(peripheralUUID) {
        invariantAvailability('unbondAsync');
        invariantUUID(peripheralUUID);
        return await ExpoBluetooth.unbondAsync(peripheralUUID);
    },
    async enableBluetoothAsync(isBluetoothEnabled) {
        invariantAvailability('enableBluetoothAsync');
        return await ExpoBluetooth.enableBluetoothAsync(isBluetoothEnabled);
    },
    async getBondedPeripheralsAsync() {
        invariantAvailability('getBondedPeripheralsAsync');
        return await ExpoBluetooth.getBondedPeripheralsAsync();
    },
    async requestConnectionPriorityAsync(peripheralUUID, connectionPriority) {
        invariantAvailability('requestConnectionPriorityAsync');
        invariantUUID(peripheralUUID);
        return await ExpoBluetooth.requestConnectionPriorityAsync(peripheralUUID, connectionPriority);
    },
    observeBluetoothAvailabilty(callback) {
        return addHandlerForKey(EVENTS.SYSTEM_AVAILABILITY_CHANGED, callback);
    },
    observeBluetoothEnabled(callback) {
        return addHandlerForKey(EVENTS.SYSTEM_ENABLED_STATE_CHANGED, callback);
    },
};
export { android };
export async function _reset() {
    await stopScanningAsync();
    clearPeripherals();
    await _resetAllHandlers();
}
let lastEvent;
addListener(({ data, event }) => {
    const { peripheral, peripherals, central, advertisementData, RSSI, error } = data;
    lastEvent = event;
    // console.log('GOT EVENT: ', { data, event });
    if (event === 'UPDATE') {
        clearPeripherals();
        if (peripherals) {
            for (const peripheral of peripherals) {
                updateStateWithPeripheral(peripheral);
            }
        }
        firePeripheralObservers();
        return;
    }
    if (event === EVENTS.PERIPHERAL_DISCOVERED_SERVICES) {
        console.log("SERVICES: ", peripheral);
    }
    else {
        console.log('Event: ' + event + (lastEvent ? ', last: ' + lastEvent : ''));
    }
    switch (event) {
        case EVENTS.DESCRIPTOR_DID_READ:
        case EVENTS.DESCRIPTOR_DID_WRITE:
        case EVENTS.CHARACTERISTIC_DID_READ:
        case EVENTS.CHARACTERISTIC_DID_WRITE:
        case EVENTS.CHARACTERISTIC_DID_NOTIFY:
        case EVENTS.PERIPHERAL_DISCOVERED_SERVICES:
        case EVENTS.SERVICE_DISCOVERED_CHARACTERISTICS:
        case EVENTS.SERVICE_DISCOVERED_INCLUDED_SERVICES:
        case EVENTS.CHARACTERISTIC_DISCOVERED_DESCRIPTORS:
        case EVENTS.CHARACTERISTIC_DISCOVERED_DESCRIPTORS:
            // noop
            break;
        case EVENTS.PERIPHERAL_CONNECTED:
            console.log('Connect peripheral: ', peripheral.id);
            break;
        case EVENTS.CENTRAL_STATE_CHANGED:
        case EVENTS.PERIPHERAL_DISCONNECTED:
        case EVENTS.CENTRAL_DISCOVERED_PERIPHERAL:
        case EVENTS.SYSTEM_ENABLED_STATE_CHANGED:
            fireMultiEventHandlers(event, { peripheral, central, error });
            if (peripheral) {
                // Send specific events for things like disconnect.
                const uid = `${event}_${peripheral.id}`;
                fireSingleEventHandlers(uid, { peripheral, central, error });
            }
            firePeripheralObservers();
            return;
        default:
            throw new Error('EXBluetooth: Unhandled event: ' + event);
    }
});
//# sourceMappingURL=Bluetooth.js.map