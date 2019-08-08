import { Peripheral, UUID } from './Bluetooth.types';
import { peripheralIdFromId } from './operations';

// Manage all of the bluetooth information.
let _peripherals: { [peripheralId: string]: Peripheral } = {};

let _advertisements: any = {};

export function getPeripherals(): { [peripheralId: string]: Peripheral } {
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

export function updateStateWithPeripheral(peripheral: Peripheral) {
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

export function updateAdvertisementDataStore(peripheralId: string, advertisementData: any) {
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
