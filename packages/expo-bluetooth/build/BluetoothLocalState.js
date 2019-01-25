import { peripheralIdFromId } from './BluetoothTransactions';
// Manage all of the bluetooth information.
let _peripherals = {};
let _advertisements = {};
export function getPeripherals() {
    return _peripherals;
}
export function getPeripheralForId(id) {
    const uuid = peripheralIdFromId(id);
    return _peripherals[uuid];
}
export function clearPeripherals() {
    _peripherals = {};
}
export function removePeripheral(uuid) {
    delete _peripherals[uuid];
}
export function updateStateWithPeripheral(peripheral) {
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
export function updateAdvertismentDataStore(peripheralId, advertisementData) {
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
//# sourceMappingURL=BluetoothLocalState.js.map