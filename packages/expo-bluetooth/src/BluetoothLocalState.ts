import { NativePeripheral, UUID } from './Bluetooth.types';
import { peripheralIdFromId } from './BluetoothTransactions';

// Manage all of the bluetooth information.
let _peripherals: { [peripheralId: string]: NativePeripheral } = {};

let _advertisements: any = {};

export function getPeripherals(): { [peripheralId: string]: NativePeripheral } {
  return _peripherals;
}

export function getPeripheralForId(id: string): any {
  const uuid = peripheralIdFromId(id);
  return _peripherals[uuid];
}

export function clearPeripherals() {
  _peripherals = {};
}

export function removePeripheral(uuid: UUID) {
  delete _peripherals[uuid];
}

export function updateStateWithPeripheral(peripheral: NativePeripheral) {
  const {
    [peripheral.id]: currentPeripheral = {
      discoveryTimestamp: Date.now(),
      advertisementData: undefined,
      RSSI: null,
    },
    ...others
  } = _peripherals;
  _peripherals = {
    ...others,
    [peripheral.id]: {
      discoveryTimestamp: currentPeripheral.discoveryTimestamp,
      advertisementData: currentPeripheral.advertisementData,
      RSSI: currentPeripheral.RSSI,
      // ...currentPeripheral,
      ...peripheral,
    },
  };
}

export function updateAdvertismentDataStore(peripheralId: string, advertisementData: any) {
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
