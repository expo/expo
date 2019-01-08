import { EventEmitter, Subscription } from 'expo-core';

import { UnavailabilityError } from 'expo-errors';

import ExpoBluetooth from './ExpoBluetooth';
import { DeviceInterface } from './Bluetooth.types';

const eventEmitter = new EventEmitter(ExpoBluetooth);

type DeviceFoundCallback = ((device: DeviceInterface) => void);
type ScanOptions = {
  options?: any;
  uuid?: string;
  serviceUUIDs?: string[];
};

function _validateUUID(uuid: string | undefined): string {
  if (uuid === undefined || (typeof uuid !== 'string' && uuid === '')) {
    throw new Error('Bluetooth: Invalid UUID provided!');
  }
  return uuid;
}

export const { Events } = ExpoBluetooth;

const multiEventHandlers: any = {
  [Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT]: [],
  [Events.CENTRAL_DID_UPDATE_STATE_EVENT]: [],
};

export async function startScanAsync(
  options: ScanOptions = {},
  callback: DeviceFoundCallback
): Promise<Subscription> {
  if (!ExpoBluetooth.startScanAsync) {
    throw new UnavailabilityError('Bluetooth', 'startScanAsync');
  }
  await ExpoBluetooth.startScanAsync(options);

  multiEventHandlers[Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT].push(callback);

  return {
    remove() {
      const index = multiEventHandlers[Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT].indexOf(
        callback
      );
      if (index != -1) {
        multiEventHandlers[Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT].splice(index, 1);
      }
    },
  };
}

export async function stopScanAsync(): Promise<any> {
  if (!ExpoBluetooth.stopScanAsync) {
    throw new UnavailabilityError('Bluetooth', 'stopScanAsync');
  }

  // Remove all callbacks
  multiEventHandlers[Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT] = [];

  return await ExpoBluetooth.stopScanAsync();
}

export async function observeCentralStateAsync(
  callback: DeviceFoundCallback
): Promise<Subscription> {
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

export async function stopObservingCentralStateAsync(): Promise<any> {
  // Remove all callbacks
  multiEventHandlers[Events.CENTRAL_DID_UPDATE_STATE_EVENT] = [];
}

// Peripherals

type Peripheral = {};

export async function connectAsync(options: { uuid: string; options?: any }): Promise<Peripheral> {
  if (!ExpoBluetooth.connectAsync) {
    throw new UnavailabilityError('Bluetooth', 'connectAsync');
  }
  const peripheralUUID = _validateUUID(options.uuid);
  return new Promise((resolve, reject) => {
    const transactionId = createTransactionId({ peripheralUUID }, TransactionType.connect);
    transactions[transactionId] = { resolve, reject };
    ExpoBluetooth.connectAsync(options);
  });
}

export async function disconnectAsync(options: { uuid: string }): Promise<any> {
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

//TODO: Bacon: Is this fired more than once?
// export function discoverServices(
//   options: { uuid: string; serviceUUIDs?: string[] },
//   callback: DeviceFoundCallback
// ): Subscription {
//   if (!ExpoBluetooth.discoverServicesAsync) {
//     throw new UnavailabilityError('Bluetooth', 'discoverServicesAsync');
//   }
//   const peripheralUUID = _validateUUID(options.uuid);
//   const transactionId = createTransactionId({ peripheralUUID }, TransactionType.scan);
//   transactions[transactionId] = { callback };
//   ExpoBluetooth.discoverServicesAsync(options);
//   return {
//     remove() {
//       if (transactionId in transactions) {
//         delete transactions[transactionId];
//       }
//     },
//   };
// }

type WriteOptions = {
  peripheralUUID: string;
  serviceUUID: string;
  characteristicUUID: string;
  descriptorUUID?: string;
  characteristicProperties: number;
  shouldMute: boolean;
  data: any;
};

// Interactions
function createTransactionId(
  options: {
    peripheralUUID?: string;
    serviceUUID?: string;
    characteristicUUID?: string;
    descriptorUUID?: string;
  },
  transactionType: TransactionType
): string {
  let targets: string[] = [transactionType];

  if (options.peripheralUUID) targets.push(options.peripheralUUID);
  if (options.serviceUUID) targets.push(options.serviceUUID);
  if (options.characteristicUUID) targets.push(options.characteristicUUID);
  if (options.descriptorUUID) targets.push(options.descriptorUUID);
  return targets.join('|');
}

export async function readAsync(options: WriteOptions): Promise<any> {
  return await updateAsync(options, TransactionType.read);
}

export async function writeAsync(options: WriteOptions): Promise<any> {
  return await updateAsync(options, TransactionType.write);
}

export async function updateAsync(options: WriteOptions, operation: TransactionType): Promise<any> {
  if (!ExpoBluetooth.updateAsync) {
    throw new UnavailabilityError('Bluetooth', 'updateAsync');
  }
  _validateUUID(options.peripheralUUID);
  _validateUUID(options.serviceUUID);
  _validateUUID(options.characteristicUUID);
  return new Promise((resolve, reject) => {
    const transactionId = createTransactionId(options, operation);
    transactions[transactionId] = { resolve, reject };
    ExpoBluetooth.updateAsync(options);
  });
}

//TODO: Bacon: Add this
// export async function readRSSIAsync({ uuid } = {}): Promise<any> {
//   if (!ExpoBluetooth.readRSSIAsync) {
//     throw new UnavailabilityError('Bluetooth', 'readRSSIAsync');
//   }
//   _validateUUID(uuid);
//   return await ExpoBluetooth.readRSSIAsync({ uuid });
// }

// Get data

export async function getPeripheralsAsync(): Promise<any[]> {
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

export async function getCentralAsync(): Promise<any> {
  if (!ExpoBluetooth.getCentralAsync) {
    throw new UnavailabilityError('Bluetooth', 'getCentralAsync');
  }
  return await ExpoBluetooth.getCentralAsync();
}

export async function isScanningAsync(): Promise<any> {
  const { isScanning } = await getCentralAsync();
  return isScanning;
}

/* EXP Listener Pattern */
export function addListener(listener: (event: any) => void): Subscription {
  const subscription = eventEmitter.addListener(ExpoBluetooth.BLUETOOTH_EVENT, listener);
  return subscription;
}

export function removeAllListeners(): void {
  eventEmitter.removeAllListeners(ExpoBluetooth.BLUETOOTH_EVENT);
}

// Manage all of the bluetooth information.
let peripherals: { [id: string]: DeviceInterface } = {};

let _advertisments: any = {};
let _center: any = {};
function updateStateWithPeripheral(peripheral: DeviceInterface) {
  const { [peripheral.id]: currentPeripheral = {}, ...others } = peripherals;
  peripherals = {
    ...others,
    [peripheral.id]: {
      // ...currentPeripheral,
      ...peripheral,
    },
  };
}
function updateAdvertismentDataStore(peripheralId: string, advertismentData: any) {
  const { [peripheralId]: current = {}, ...others } = _advertisments;
  _advertisments = {
    ...others,
    [peripheralId]: {
      peripheralId,
      // ...current,
      ...advertismentData,
    },
  };
}

enum TransactionType {
  get = 'get',
  read = 'read',
  write = 'write',
  connect = 'connect',
  disconnect = 'disconnect',
  scan = 'scan',
}

let transactions: any = {};

addListener(({ data, event }) => {
  const {
    transactionId,
    peripheral,
    peripherals,
    center,
    descriptor,
    service,
    advertisementData,
    rssi,
    characteristic,
    error,
  } = data;

  if (center) {
    _center = center;
  }

  if (advertisementData) {
    updateAdvertismentDataStore(peripheral.id, advertisementData);
    peripheral.advertismentData = advertisementData;
  }
  if (rssi) {
    peripheral.rssi = rssi;
  }

  if (peripheral) {
    updateStateWithPeripheral(peripheral);
  }
  if (peripherals) {
    for (const peripheral of peripherals) {
      updateStateWithPeripheral(peripheral);
    }
  }

  if (transactionId) {
    if (transactionId in transactions) {
      //TODO: Multi callbacks -ex: multiple search for services of same peripheral
      const { resolve, reject, callbacks } = transactions[transactionId];
      if (callbacks) {
        for (let callback of callbacks) {
          if (callback instanceof Function) {
            callback(data);
          } else {
            const { resolve, reject } = callback;
            if (error) {
              reject(new Error(error.description));
            } else {
              resolve(data);
            }
            removeCallbackForTransactionId(callback, transactionId);
          }
        }
        if (error) {
          throw new Error('why am i called' + error.description);
        }
      } else if (resolve && reject) {
        if (error) {
          reject(new Error(error.description));
        } else {
          resolve(data);
        }
        delete transactions[transactionId];
      } else {
        console.log('Throwing Error because no callback is found for transactionId: ', {
          data,
          transactions,
        });
        throw new Error('Unknown error');
      }
    } else {
      throw new Error('Unhandled transactionId');
    }
  } else {
    if (error) {
      throw new Error(error.description);
    }
    switch (event) {
      case Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT:
      case Events.CENTRAL_DID_UPDATE_STATE_EVENT:
        for (const callback of multiEventHandlers[event]) {
          callback(data);
        }
      case Events.CENTRAL_DID_RETRIEVE_CONNECTED_PERIPHERALS_EVENT:
      case Events.CENTRAL_DID_RETRIEVE_PERIPHERALS_EVENT:
        return;
      default:
        throw new Error('Unhandled event: ' + event);

        break;
    }
  }
});

// TODO: Bacon: Are these called more than once? - I'm gonna assume they are, I didn't see any instance of these being called multiple times. Because of this I'll use the singular structure.
// TODO: Bacon: Add serviceUUIDs
export async function discoverServicesForPeripheralAsync({
  id,
}): Promise<{ peripheral: any | null }> {
  return await discoverAsync({ id });
}

export async function discoverCharacteristicsForServiceAsync({
  id,
}): Promise<{ service: any | null }> {
  return await discoverAsync({ id });
}

export async function discoverDescriptorsForCharacteristicAsync({
  id,
}): Promise<{ service: any | null }> {
  return await discoverAsync({ id });
}

function discover(
  options: {
    peripheralUUID?: string;
    serviceUUID?: string;
    serviceUUIDs?: string[];
    characteristicUUID?: string;
  },
  callback: Function
) {
  if (!ExpoBluetooth.discover) {
    throw new UnavailabilityError('Bluetooth', 'discover');
  }

  const { peripheralUUID, serviceUUID, characteristicUUID } = options;
  const transactionId = createTransactionId(
    { peripheralUUID, serviceUUID, characteristicUUID },
    TransactionType.scan
  );
  console.log('Create Transaction ID: ', {
    transactionId,
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
  });

  addCallbackForTransactionId(callback, transactionId);

  ExpoBluetooth.discover(options);

  return {
    remove() {
      removeCallbackForTransactionId(callback, transactionId);
    },
  };
}
async function discoverAsync(options: {
  id: string;
  serviceUUIDsToQuery?: string[];
}): Promise<any> {
  if (!ExpoBluetooth.discover) {
    throw new UnavailabilityError('Bluetooth', 'discover');
  }

  const { serviceUUIDsToQuery, id } = options;

  const [peripheralUUID, serviceUUID, characteristicUUID] = id.split('|');

  const transactionId = createTransactionId(
    { peripheralUUID, serviceUUID, characteristicUUID },
    TransactionType.scan
  );

  ExpoBluetooth.discover({
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
    // Extra
    serviceUUIDsToQuery,
  });

  console.log('Create Transaction ID: ', {
    transactionId,
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
  });

  return new Promise((resolve, reject) => {
    addCallbackForTransactionId({ resolve, reject }, transactionId);
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
  }
}

/*

Not used: 
    case Events.CENTRAL_DID_RETRIEVE_CONNECTED_PERIPHERALS_EVENT: 
    case Events.CENTRAL_DID_RETRIEVE_PERIPHERALS_EVENT: 


    Special:
    
    Manual/Multiple (general callbacks)
    case Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT: 
    case Events.CENTRAL_DID_UPDATE_STATE_EVENT: // TODO: Bacon: is this right?

    // Need TODO
    case Events.PERIPHERAL_DID_DISCOVER_SERVICES_EVENT: 
    case Events.PERIPHERAL_DID_DISCOVER_CHARACTERISTICS_FOR_SERVICE_EVENT: 
    case Events.PERIPHERAL_DID_DISCOVER_DESCRIPTORS_FOR_CHARACTERISTIC_EVENT:

    //transaction
        case Events.PERIPHERAL_DID_UPDATE_VALUE_FOR_CHARACTERISTIC_EVENT: 
    case Events.PERIPHERAL_DID_UPDATE_VALUE_FOR_DESCRIPTOR_EVENT: 
    case Events.PERIPHERAL_DID_UPDATE_NOTIFICATION_STATE_FOR_CHARACTERISTIC_EVENT: 
        case Events.PERIPHERAL_DID_WRITE_VALUE_FOR_CHARACTERISTIC_EVENT: 
    case Events.PERIPHERAL_DID_WRITE_VALUE_FOR_DESCRIPTOR_EVENT: 
*/
