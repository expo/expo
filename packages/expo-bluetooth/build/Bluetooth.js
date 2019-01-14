import { EventEmitter, Platform } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';
import { CentralState, PeripheralState, TransactionType, CharacteristicProperty, } from './Bluetooth.types';
export { CentralState, PeripheralState, TransactionType, CharacteristicProperty, };
import ExpoBluetooth from './ExpoBluetooth';
// const ExpoBluetooth: {
//   addListener: (eventName: string) => void;
//   removeListeners: (count: number) => void;
//   [prop: string]: any;
// } = {
//   addListener() {},
//   removeListeners() {},
//   Events: {},
// };
let transactions = {};
const eventEmitter = new EventEmitter(ExpoBluetooth);
function _validateUUID(uuid) {
    if (uuid === undefined || (typeof uuid !== 'string' && uuid === '')) {
        throw new Error('Bluetooth: Invalid UUID provided!');
    }
    return uuid;
}
export const { Events } = ExpoBluetooth;
// Manage all of the bluetooth information.
let _peripherals = {};
let _advertisements = {};
const multiEventHandlers = {
    [Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT]: [],
    [Events.CENTRAL_DID_UPDATE_STATE_EVENT]: [],
    everything: [],
    centralState: [],
};
export async function startScanAsync(scanSettings = {}) {
    if (!ExpoBluetooth.startScanAsync) {
        throw new UnavailabilityError('Bluetooth', 'startScanAsync');
    }
    const { serviceUUIDsToQuery = [], scanningOptions = {}, callback } = scanSettings;
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
    if (callback instanceof Function) {
        multiEventHandlers[Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT].push(callback);
    }
    return {
        remove() {
            const index = multiEventHandlers[Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT].indexOf(callback);
            if (index != -1) {
                multiEventHandlers[Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT].splice(index, 1);
            }
        },
    };
}
export async function stopScanAsync() {
    if (!ExpoBluetooth.stopScanAsync) {
        throw new UnavailabilityError('Bluetooth', 'stopScanAsync');
    }
    // Remove all callbacks
    multiEventHandlers[Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT] = [];
    await ExpoBluetooth.stopScanAsync();
}
// Avoiding using "start" in passive method names
export async function observeUpdatesAsync(callback) {
    multiEventHandlers.everything.push(callback);
    return {
        remove() {
            const index = multiEventHandlers.everything.indexOf(callback);
            if (index != -1) {
                multiEventHandlers.everything.splice(index, 1);
            }
        },
    };
}
export async function observeStateAsync(callback) {
    const central = await getCentralAsync();
    callback(central.state);
    // TODO: Bacon: Is this just automatic?
    multiEventHandlers[Events.CENTRAL_DID_UPDATE_STATE_EVENT].push(callback);
    return {
        remove() {
            const index = multiEventHandlers[Events.CENTRAL_DID_UPDATE_STATE_EVENT].indexOf(callback);
            if (index != -1) {
                multiEventHandlers[Events.CENTRAL_DID_UPDATE_STATE_EVENT].splice(index, 1);
            }
        },
    };
}
export async function connectAsync(options) {
    if (!ExpoBluetooth.connectAsync) {
        throw new UnavailabilityError('Bluetooth', 'connectAsync');
    }
    const peripheralUUID = _validateUUID(options.uuid);
    return new Promise((resolve, reject) => {
        const transactionId = createTransactionId({ peripheralUUID }, TransactionType.connect);
        let timeoutTag;
        if (options.timeout) {
            timeoutTag = setTimeout(() => {
                disconnectAsync({ uuid: peripheralUUID });
                delete transactions[transactionId];
                reject('request timeout');
            }, options.timeout);
        }
        transactions[transactionId] = {
            resolve(...props) {
                clearTimeout(timeoutTag);
                return resolve(...props);
            },
            reject(...props) {
                clearTimeout(timeoutTag);
                return reject(...props);
            },
        };
        ExpoBluetooth.connectAsync(options);
    });
}
export async function disconnectAsync(options) {
    if (!ExpoBluetooth.disconnectAsync) {
        throw new UnavailabilityError('Bluetooth', 'disconnectAsync');
    }
    const peripheralUUID = _validateUUID(options.uuid);
    return new Promise((resolve, reject) => {
        const transactionId = createTransactionId({ peripheralUUID }, TransactionType.disconnect);
        transactions[transactionId] = { resolve, reject };
        ExpoBluetooth.disconnectAsync(options);
    });
}
export async function readAsync(options) {
    return await updateAsync(options, TransactionType.read);
}
export async function writeAsync(options) {
    return await updateAsync(options, TransactionType.write);
}
async function updateAsync(options, operation) {
    if (!ExpoBluetooth.updateAsync) {
        throw new UnavailabilityError('Bluetooth', 'updateAsync');
    }
    _validateUUID(options.peripheralUUID);
    _validateUUID(options.serviceUUID);
    _validateUUID(options.characteristicUUID);
    return new Promise((resolve, reject) => {
        const transactionId = createTransactionId(options, operation);
        transactions[transactionId] = { resolve, reject };
        ExpoBluetooth.updateAsync({ ...options, operation });
    });
}
export async function readRSSIAsync(peripheralUUID) {
    if (!ExpoBluetooth.readRSSIAsync) {
        throw new UnavailabilityError('Bluetooth', 'readRSSIAsync');
    }
    _validateUUID(peripheralUUID);
    return new Promise((resolve, reject) => {
        const transactionId = createTransactionId({ peripheralUUID }, TransactionType.read);
        transactions[transactionId] = { resolve, reject };
        ExpoBluetooth.readRSSIAsync({ uuid: peripheralUUID });
    });
}
export async function getPeripheralsAsync() {
    if (!ExpoBluetooth.getPeripheralsAsync) {
        throw new UnavailabilityError('Bluetooth', 'getPeripheralsAsync');
    }
    // TODO: Bacon: Do we need to piggy back and get the delegate results? Or is the cached version accurate enough to return?
    return await ExpoBluetooth.getPeripheralsAsync({});
    // return new Promise((resolve, reject) => {
    //   getPeripheralsAsyncCallbacks.push({ resolve, reject });
    //   ExpoBluetooth.getPeripheralsAsync(options);
    // })
}
export function getPeripherals() {
    return _peripherals;
}
export function getPeripheralForId(id) {
    const uuid = peripheralIdFromId(id);
    return _peripherals[uuid];
}
export async function getCentralAsync() {
    if (!ExpoBluetooth.getCentralAsync) {
        throw new UnavailabilityError('Bluetooth', 'getCentralAsync');
    }
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
            await connectAsync({ uuid: peripheralId });
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
    const components = id.split('|');
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
    // console.log("GOT EVENT: ", {data: !!data, event});
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
    firePeripheralObservers(error);
    if (transactionId) {
        if (transactionId in transactions) {
            const { resolve, reject, callbacks } = transactions[transactionId];
            console.log('Handle: ', { transactionId, transactions: Object.keys(transactions), event, data: Object.keys(data) });
            if (callbacks) {
                for (let callback of callbacks) {
                    if (callback instanceof Function) {
                        // TODO: Bacon: should we pass back an error? Will one ever exist?
                        callback(data);
                    }
                    else {
                        const { resolve, reject } = callback;
                        if (error) {
                            reject(new Error(error.message));
                        }
                        else {
                            resolve(data);
                        }
                        removeCallbackForTransactionId(callback, transactionId);
                    }
                }
            }
            else if (resolve && reject) {
                if (error) {
                    reject(new Error(error.message));
                }
                else {
                    resolve(data);
                }
                delete transactions[transactionId];
            }
            else {
                console.log('Throwing Error because no callback is found for transactionId: ', {
                    data,
                    transactions,
                });
                throw new Error('Unknown error');
            }
        }
        else {
            console.log('Unhandled transactionId', { transactionId, transactions: Object.keys(transactions), event, data: Object.keys(data) });
            // throw new Error('Unhandled transactionId');
        }
    }
    else {
        switch (event) {
            case Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT:
                fireMultiEventHandlers(event, { central, peripheral });
                return;
            case Events.CENTRAL_DID_UPDATE_STATE_EVENT:
                console.log('CENTRAL DID UPDATE STATE', event);
                if (!central) {
                    throw new Error('EXBluetooth: Central not defined while processing: ' + event);
                }
                // Currently this is iOS only
                if (Platform.OS === 'ios') {
                    const peripheralsAreStillValid = central.state == CentralState.PoweredOff || central.state === CentralState.PoweredOn;
                    if (!peripheralsAreStillValid) {
                        // Clear caches
                        _peripherals = {};
                        firePeripheralObservers(error);
                    }
                }
                for (const callback of multiEventHandlers[event]) {
                    callback(central.state);
                }
                return;
            case Events.CENTRAL_DID_RETRIEVE_CONNECTED_PERIPHERALS_EVENT:
            case Events.CENTRAL_DID_RETRIEVE_PERIPHERALS_EVENT:
                return;
            default:
                throw new Error('EXBluetooth: Unhandled event: ' + event);
        }
    }
});
// Interactions
function createTransactionId(options, transactionType) {
    let targets = [transactionType];
    if (options.peripheralUUID)
        targets.push(options.peripheralUUID);
    if (options.serviceUUID)
        targets.push(options.serviceUUID);
    if (options.characteristicUUID)
        targets.push(options.characteristicUUID);
    if (options.descriptorUUID)
        targets.push(options.descriptorUUID);
    return targets.join('|');
}
function addListener(listener) {
    const subscription = eventEmitter.addListener(ExpoBluetooth.BLUETOOTH_EVENT, listener);
    return subscription;
}
// TODO: Bacon: How do we plan on calling this...
function removeAllListeners() {
    eventEmitter.removeAllListeners(ExpoBluetooth.BLUETOOTH_EVENT);
}
function updateStateWithPeripheral(peripheral) {
    const { [peripheral.id]: currentPeripheral = {
        discoveryTimestamp: Date.now(),
        advertisementData: undefined,
        rssi: null,
    }, ...others } = _peripherals;
    _peripherals = {
        ...others,
        [peripheral.id]: {
            discoveryTimestamp: currentPeripheral.discoveryTimestamp,
            advertisementData: currentPeripheral.advertisementData,
            rssi: currentPeripheral.rssi,
            // ...currentPeripheral,
            ...peripheral,
        },
    };
}
function updateAdvertismentDataStore(peripheralId, advertisementData) {
    const { [peripheralId]: current = {}, ...others } = _advertisements;
    _advertisements = {
        ...others,
        [peripheralId]: {
            peripheralId,
            // ...current,
            ...advertisementData,
        },
    };
}
function firePeripheralObservers(error) {
    for (const subscription of multiEventHandlers.everything) {
        subscription({ peripherals: getPeripherals(), error });
    }
}
function fireMultiEventHandlers(event, { central, peripheral }) {
    for (const callback of multiEventHandlers[event]) {
        callback({ central, peripheral });
    }
}
function peripheralIdFromId(id) {
    return id.split('|')[0];
}
async function discoverAsync(options) {
    if (!ExpoBluetooth.discoverAsync) {
        throw new UnavailabilityError('Bluetooth', 'discoverAsync');
    }
    const { serviceUUIDsToQuery, id } = options;
    const [peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID] = id.split('|');
    const transactionId = createTransactionId({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }, TransactionType.scan);
    return new Promise((resolve, reject) => {
        console.log("discoverAsync(): ", transactionId);
        addCallbackForTransactionId({ resolve, reject }, transactionId);
        ExpoBluetooth.discoverAsync({
            peripheralUUID,
            serviceUUID,
            characteristicUUID,
            serviceUUIDsToQuery,
        });
    });
}
function ensureCallbacksArrayForTransactionId(transactionId) {
    if (!(transactionId in transactions) || !Array.isArray(transactions[transactionId].callbacks)) {
        transactions[transactionId] = { callbacks: [] };
    }
}
function addCallbackForTransactionId(callback, transactionId) {
    ensureCallbacksArrayForTransactionId(transactionId);
    transactions[transactionId].callbacks.push(callback);
}
function removeCallbackForTransactionId(callback, transactionId) {
    ensureCallbacksArrayForTransactionId(transactionId);
    const index = transactions[transactionId].callbacks.indexOf(callback);
    if (index != -1) {
        transactions[transactionId].callbacks.splice(index, 1);
        if (transactions[transactionId].callbacks.length === 0) {
            delete transactions[transactionId];
        }
    }
}
//# sourceMappingURL=Bluetooth.js.map