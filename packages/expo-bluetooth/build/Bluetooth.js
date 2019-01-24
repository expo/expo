import { Platform } from 'expo-core';
import { CentralState, CharacteristicProperty, PeripheralState, TransactionType, } from './Bluetooth.types';
import { BLUETOOTH_EVENT, DELIMINATOR, EVENTS, TYPES } from './BluetoothConstants';
import BluetoothError from './BluetoothError';
import { addHandlerForKey, addListener, fireMultiEventHandlers, firePeripheralObservers, getHandlersForKey, resetHandlersForKey, } from './BluetoothEventHandler';
import { invariantAvailability, invariantUUID } from './BluetoothInvariant';
import { clearPeripherals, getPeripherals, updateAdvertismentDataStore, updateStateWithPeripheral, } from './BluetoothLocalState';
import { addCallbackForTransactionId, addTransactionForId, deleteTransactionForId, getTransactionForId, getTransactions, peripheralIdFromId, removeCallbackForTransactionId, } from './BluetoothTransactions';
import ExpoBluetooth from './ExpoBluetooth';
import Transaction from './Transaction';
export { CentralState, PeripheralState, TransactionType, CharacteristicProperty, };
export { BLUETOOTH_EVENT, TYPES, EVENTS };
export async function startScanAsync(scanSettings = {}) {
    invariantAvailability('startScanAsync');
    const { serviceUUIDsToQuery = [], scanningOptions = {}, callback = function () { } } = scanSettings;
    /* Prevents the need for CBCentralManagerScanOptionAllowDuplicatesKey in the info.plist */
    const serviceUUIDsWithoutDuplicates = [...new Set(serviceUUIDsToQuery)];
    /* iOS:
     *
     * Although strongly discouraged,
     * if <i>serviceUUIDs</i> is <i>nil</i> all discovered peripherals will be returned.
     * If the central is already scanning with different
     * <i>serviceUUIDs</i> or <i>options</i>, the provided parameters will replace them.
     */
    await ExpoBluetooth.startScanAsync(serviceUUIDsWithoutDuplicates, scanningOptions);
    return addHandlerForKey(EVENTS.CENTRAL_DID_DISCOVER_PERIPHERAL, callback);
}
export async function stopScanAsync() {
    invariantAvailability('stopScanAsync');
    // Remove all callbacks
    resetHandlersForKey(EVENTS.CENTRAL_DID_DISCOVER_PERIPHERAL);
    await ExpoBluetooth.stopScanAsync();
}
// Avoiding using "start" in passive method names
export async function observeUpdatesAsync(callback) {
    return addHandlerForKey('everything', callback);
}
export async function observeStateAsync(callback) {
    const central = await getCentralAsync();
    callback(central.state);
    return addHandlerForKey(EVENTS.CENTRAL_DID_UPDATE_STATE, callback);
}
export async function connectAsync(peripheralUUID, options = {}) {
    invariantAvailability('connectAsync');
    invariantUUID(peripheralUUID);
    return new Promise((resolve, reject) => {
        const transaction = new Transaction({ peripheralUUID }, TransactionType.connect);
        const transactionId = transaction.generateId();
        let timeoutTag;
        if (options.timeout) {
            timeoutTag = setTimeout(() => {
                disconnectAsync(peripheralUUID);
                deleteTransactionForId(transactionId);
                reject('request timeout');
            }, options.timeout);
        }
        addTransactionForId(transactionId, {
            resolve(...props) {
                clearTimeout(timeoutTag);
                return resolve(...props);
            },
            reject(...props) {
                clearTimeout(timeoutTag);
                return reject(...props);
            },
        });
        ExpoBluetooth.connectAsync({ peripheralUUID, timeout: options.timeout, options });
    });
}
export async function disconnectAsync(peripheralUUID) {
    invariantAvailability('disconnectAsync');
    invariantUUID(peripheralUUID);
    return new Promise((resolve, reject) => {
        const transactionId = Transaction.generateTransactionId({ peripheralUUID }, TransactionType.disconnect);
        addTransactionForId(transactionId, { resolve, reject });
        ExpoBluetooth.disconnectAsync({ peripheralUUID });
    });
}
/* TODO: Bacon: Add a return type */
export async function readDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }) {
    const output = await updateDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }, CharacteristicProperty.Read);
    if (output && output.descriptor) {
        const descriptor = output.descriptor;
        return descriptor.value;
    }
    throw new Error(`Not able to read descriptor: ${JSON.stringify({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID })}`);
}
/* TODO: Bacon: Add a return type */
export async function writeDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, data }) {
    return await updateDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, data }, CharacteristicProperty.Write);
}
/* TODO: Bacon: Add a return type */
export async function readCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID }) {
    const output = await updateCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID }, CharacteristicProperty.Read);
    if (output && output.characteristic) {
        const characteristic = output.characteristic;
        return characteristic.value;
    }
    throw new Error(`Not able to read characteristic: ${JSON.stringify({ peripheralUUID, serviceUUID, characteristicUUID })}`);
}
/* TODO: Bacon: Add a return type */
export async function writeCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, data }) {
    return await updateCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, data }, CharacteristicProperty.Write);
}
/* TODO: Bacon: Why would anyone use this? */
/* TODO: Bacon: Test if this works */
/* TODO: Bacon: Add a return type */
export async function writeCharacteristicWithoutResponseAsync({ peripheralUUID, serviceUUID, characteristicUUID, data }) {
    return await updateCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, data }, CharacteristicProperty.WriteWithoutResponse);
}
export async function readRSSIAsync(peripheralUUID) {
    invariantAvailability('readRSSIAsync');
    invariantUUID(peripheralUUID);
    return new Promise((resolve, reject) => {
        const transactionId = Transaction.generateTransactionId({ peripheralUUID }, TransactionType.rssi);
        addTransactionForId(transactionId, { resolve, reject });
        ExpoBluetooth.readRSSIAsync({ peripheralUUID });
    });
}
export async function getPeripheralsAsync() {
    invariantAvailability('getPeripheralsAsync');
    // TODO: Bacon: Do we need to piggy back and get the delegate results? Or is the cached version accurate enough to return?
    return await ExpoBluetooth.getPeripheralsAsync({});
    // return new Promise((resolve, reject) => {
    //   getPeripheralsAsyncCallbacks.push({ resolve, reject });
    //   ExpoBluetooth.getPeripheralsAsync(options);
    // })
}
export async function getCentralAsync() {
    invariantAvailability('getCentralAsync');
    return await ExpoBluetooth.getCentralAsync();
}
export async function isScanningAsync() {
    const { isScanning } = await getCentralAsync();
    return isScanning;
}
// TODO: Bacon: Add serviceUUIDs
export async function discoverServicesForPeripheralAsync(options) {
    return await discoverAsync(options);
}
export async function discoverCharacteristicsForServiceAsync({ id, }) {
    return await discoverAsync({ id });
}
export async function discoverDescriptorsForCharacteristicAsync({ id, }) {
    return await discoverAsync({ id });
}
export async function loadPeripheralAsync({ id }, skipConnecting = false) {
    const peripheralId = peripheralIdFromId(id);
    const peripheral = getPeripherals()[peripheralId];
    if (!peripheral) {
        throw new Error('Not a peripheral ' + peripheralId);
    }
    if (peripheral.state !== 'connected') {
        if (!skipConnecting) {
            await connectAsync(peripheralId);
            return loadPeripheralAsync({ id }, true);
        }
        else {
            // This should never be called because in theory connectAsync would throw an error.
        }
    }
    else if (peripheral.state === 'connected') {
        await loadChildrenRecursivelyAsync({ id: peripheralId });
    }
    // In case any updates occured during this function.
    return getPeripherals()[peripheralId];
}
export async function loadChildrenRecursivelyAsync({ id }) {
    const components = id.split(DELIMINATOR);
    console.log({ components });
    if (components.length === 4) {
        // Descriptor ID
        throw new Error('Descriptors have no children');
    }
    else if (components.length === 3) {
        // Characteristic ID
        console.log('Load Characteristic ', id);
        const { characteristic: { descriptors }, } = await discoverDescriptorsForCharacteristicAsync({ id });
        return descriptors;
    }
    else if (components.length === 2) {
        // Service ID
        console.log('Load Service ', id);
        const { service, } = await discoverCharacteristicsForServiceAsync({ id });
        console.log("LOADED CHARACTERISTICS FROM SERVICE", service);
        return await Promise.all(service.characteristics.map(characteristic => loadChildrenRecursivelyAsync(characteristic)));
    }
    else if (components.length === 1) {
        // Peripheral ID
        console.log('Load Peripheral ', id);
        const { peripheral: { services }, } = await discoverServicesForPeripheralAsync({ id });
        return await Promise.all(services.map(service => loadChildrenRecursivelyAsync(service)));
    }
    else {
        throw new Error(`Unknown ID ${id}`);
    }
}
addListener(({ data, event }) => {
    const { transactionId, peripheral, peripherals, central, advertisementData, rssi, error } = data;
    console.log("GOT EVENT: ", { data: data, event });
    if (central) {
        // _central = central;
    }
    if (peripheral) {
        if (advertisementData) {
            updateAdvertismentDataStore(peripheral.id, advertisementData);
            peripheral.advertisementData = advertisementData;
        }
        if (rssi) {
            peripheral.rssi = rssi;
        }
        updateStateWithPeripheral(peripheral);
    }
    if (peripherals) {
        for (const peripheral of peripherals) {
            updateStateWithPeripheral(peripheral);
        }
    }
    if (transactionId) {
        if (error == null) {
            // TODO: Bacon: Handle the case where a peripheral disconnects from the central randomly.
            firePeripheralObservers();
        }
        if (transactionId in getTransactions()) {
            const { resolve, reject, callbacks } = getTransactionForId(transactionId);
            // console.log('Handle: ', { transactionId, transactions: Object.keys(getTransactions()), event, data: Object.keys(data) });
            if (callbacks) {
                for (let callback of callbacks) {
                    if (callback instanceof Function) {
                        // TODO: Bacon: should we pass back an error? Will one ever exist?
                        callback(data);
                    }
                    else {
                        const { resolve, reject } = callback;
                        if (error) {
                            reject(new BluetoothError(error));
                        }
                        else {
                            const { error, ...outputData } = data;
                            resolve(outputData);
                        }
                        removeCallbackForTransactionId(callback, transactionId);
                    }
                }
                return;
            }
            else if (resolve && reject) {
                if (error) {
                    reject(new BluetoothError(error));
                }
                else {
                    const { error, ...outputData } = data;
                    resolve(outputData);
                }
                deleteTransactionForId(transactionId);
                return;
            }
            else {
                console.log('Throwing Error because no callback is found for transactionId: ', {
                    data,
                    transactions: getTransactions()
                });
                throw new Error('Unknown error');
            }
        }
        else {
            console.log('Unhandled transactionId', { transactionId, transactions: Object.keys(getTransactions()), event, data: Object.keys(data) });
            // throw new Error('Unhandled transactionId');
        }
    }
    else {
        switch (event) {
            case EVENTS.CENTRAL_DID_DISCOVER_PERIPHERAL:
                fireMultiEventHandlers(event, { central, peripheral });
                firePeripheralObservers();
                return;
            case EVENTS.CENTRAL_DID_UPDATE_STATE:
                if (!central) {
                    throw new Error('EXBluetooth: Central not defined while processing: ' + event);
                }
                // Currently this is iOS only
                if (Platform.OS === 'ios') {
                    const peripheralsAreStillValid = central.state == CentralState.PoweredOff || central.state === CentralState.PoweredOn;
                    if (!peripheralsAreStillValid) {
                        // Clear caches
                        clearPeripherals();
                        firePeripheralObservers();
                    }
                }
                for (const callback of getHandlersForKey(event)) {
                    callback(central.state);
                }
                return;
            case EVENTS.CENTRAL_DID_RETRIEVE_CONNECTED_PERIPHERALS:
            case EVENTS.CENTRAL_DID_RETRIEVE_PERIPHERALS:
                return;
            default:
                throw new Error('EXBluetooth: Unhandled event: ' + event);
        }
    }
});
// Interactions
async function discoverAsync(options) {
    invariantAvailability('discoverAsync');
    const { serviceUUIDsToQuery, id } = options;
    const transaction = Transaction.fromTransactionId(id);
    transaction.setType(TransactionType.scan);
    return new Promise((resolve, reject) => {
        addCallbackForTransactionId({ resolve, reject }, transaction.generateId());
        ExpoBluetooth.discoverAsync({
            ...transaction.getUUIDs(),
            serviceUUIDsToQuery,
        });
    });
}
// export async function setCharacteristicShouldNotifyAsync({ isEnabled, peripheralUUID, serviceUUID, characteristicUUID, data }: any): Promise<any> {
//   return await updateCharacteristicAsync({ isEnabled, peripheralUUID, serviceUUID, characteristicUUID, data }, CharacteristicProperty.Notify);
// }
// export async function setCharacteristicShouldIndicateAsync({ isEnabled, peripheralUUID, serviceUUID, characteristicUUID, data }: any): Promise<any> {
//   return await updateCharacteristicAsync({ isEnabled, peripheralUUID, serviceUUID, characteristicUUID, data }, CharacteristicProperty.Indicate);
// }
async function updateCharacteristicAsync(options, characteristicProperties) {
    invariantAvailability('updateCharacteristicAsync');
    invariantUUID(options.peripheralUUID);
    invariantUUID(options.serviceUUID);
    invariantUUID(options.characteristicUUID);
    return new Promise((resolve, reject) => {
        const expectResponse = characteristicPropertyUpdateExpectsResponse(characteristicProperties);
        if (expectResponse) {
            const transactionId = Transaction.generateTransactionId(options, characteristicProperties);
            addTransactionForId(transactionId, { resolve, reject });
        }
        else {
            resolve();
        }
        ExpoBluetooth.updateCharacteristicAsync({ ...options, characteristicProperties });
    });
}
function characteristicPropertyUpdateExpectsResponse(characteristicProperty) {
    if (characteristicProperty === CharacteristicProperty.WriteWithoutResponse) {
        return false;
    }
    return true;
}
async function updateDescriptorAsync(options, characteristicProperties) {
    invariantAvailability('updateDescriptorAsync');
    invariantUUID(options.peripheralUUID);
    invariantUUID(options.serviceUUID);
    invariantUUID(options.characteristicUUID);
    invariantUUID(options.descriptorUUID);
    return new Promise((resolve, reject) => {
        const transactionId = Transaction.generateTransactionId(options, characteristicProperties);
        addTransactionForId(transactionId, { resolve, reject });
        ExpoBluetooth.updateDescriptorAsync({ ...options, characteristicProperties });
    });
}
//# sourceMappingURL=Bluetooth.js.map