import { Platform, Subscription } from 'expo-core';

import {
  Base64,
  Priority,
  Central,
  CentralState,
  CharacteristicProperty,
  Identifier,
  NativeAdvertismentData,
  NativeBluetoothElement,
  NativeCharacteristic,
  NativeDescriptor,
  NativeError,
  NativeEventData,
  NativePeripheral,
  NativeService,
  PeripheralFoundCallback,
  PeripheralState,
  ScanSettings,
  StateUpdatedCallback,
  TransactionId,
  TransactionType,
  UUID,
  WriteCharacteristicOptions,
} from './Bluetooth.types';
import { BLUETOOTH_EVENT, DELIMINATOR, EVENTS, TYPES } from './BluetoothConstants';
import {
  addHandlerForKey,
  addListener,
  fireMultiEventHandlers,
  fireSingleEventHandlers,
  firePeripheralObservers,
  addHandlerForID,
  getHandlersForKey,
  resetHandlersForKey,
  _resetAllHandlers,
} from './BluetoothEventHandler';
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

type ScanOptions = {
  serviceUUIDsToQuery?: string[];
  androidScanMode?: any;
  androidMatchMode?: any;
  /**
   * Match as many advertisement per filter as hw could allow
   * dependes on current capability and availability of the resources in hw.
   */
  androidNumberOfMatches?: any;
  /** Oreo (26)+ */
  androidOnlyConnectable?: boolean;
};

type CancelScanningCallback = () => void;
/**
 * **iOS:**
 *
 * Although strongly discouraged,
 * if `serviceUUIDsToQuery` is `null | undefined` all discovered peripherals will be returned.
 * If the central is already scanning with different
 * `serviceUUIDsToQuery` or `scanSettings`, the provided parameters will replace them.
 */
export async function startScanningAsync(
  scanSettings: ScanOptions = {},
  callback: (peripheral: NativePeripheral) => void
): Promise<CancelScanningCallback> {
  invariantAvailability('startScanningAsync');
  invariant(callback, 'startScanningAsync({ ... }, null): callback is not defined');

  const { serviceUUIDsToQuery = [], ...scanningOptions } = scanSettings;

  console.log(
    'STARTTT:',
    await ExpoBluetooth.startScanningAsync([...new Set(serviceUUIDsToQuery)], scanningOptions)
  );

  const subscription = addHandlerForKey(EVENTS.CENTRAL_DISCOVERED_PERIPHERAL, event => {
    invariant(callback, 'startScanningAsync({ ... }, null): callback is not defined');
    if (!event) {
      throw new Error('UNEXPECTED ' + EVENTS.CENTRAL_DISCOVERED_PERIPHERAL);
    }
    callback(event.peripheral);
  });

  return async () => {
    subscription.remove();
    await stopScanningAsync();
  };
}

export async function stopScanningAsync(): Promise<void> {
  invariantAvailability('stopScanningAsync');
  // Remove all callbacks
  await resetHandlersForKey(EVENTS.CENTRAL_DISCOVERED_PERIPHERAL);
  await ExpoBluetooth.stopScanningAsync();
}

// Avoiding using "start" in passive method names
export function observeUpdates(callback: (updates: any) => void): Subscription {
  return addHandlerForKey('everything', callback);
}

export function observeScanningErrors(callback: (updates: any) => void): Subscription {
  return addHandlerForKey(EVENTS.CENTRAL_SCAN_STOPPED, callback);
}

export async function observeStateAsync(callback: StateUpdatedCallback): Promise<Subscription> {
  const central = await getCentralAsync();
  // Make the callback async so the subscription returns first.
  setTimeout(() => callback(central.state));
  return addHandlerForKey(EVENTS.CENTRAL_STATE_CHANGED, callback);
}

export async function connectAsync(
  peripheralUUID: UUID,
  options: {
    timeout?: number;
    options?: any;
    onDisconnect?: any;
  } = {}
): Promise<NativePeripheral> {
  invariantAvailability('connectPeripheralAsync');
  invariantUUID(peripheralUUID);

  const { onDisconnect } = options;
  if (onDisconnect) {
    addHandlerForID(EVENTS.PERIPHERAL_DISCONNECTED, peripheralUUID, onDisconnect);
  }

  let timeoutTag: number | undefined;

  return new Promise(async (resolve, reject) => {
    if (options.timeout) {
      timeoutTag = setTimeout(() => {
        disconnectAsync(peripheralUUID);
        reject(
          new BluetoothError({
            message: `Failed to connect to peripheral: ${peripheralUUID} in under: ${
              options.timeout
            }ms`,
            code: 'timeout',
          })
        );
      }, options.timeout);
    }

    let result;
    try {
      result = await ExpoBluetooth.connectPeripheralAsync(peripheralUUID, options.options);
    } catch (error) {
      reject(error);
    } finally {
      clearTimeout(timeoutTag);
    }
    resolve(result);
  });
}

export async function disconnectAsync(peripheralUUID: UUID): Promise<any> {
  invariantAvailability('disconnectPeripheralAsync');
  invariantUUID(peripheralUUID);
  return await ExpoBluetooth.disconnectPeripheralAsync(peripheralUUID);
}

/* TODO: Bacon: Add a return type */
export async function readDescriptorAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
  descriptorUUID,
}: any): Promise<Base64 | undefined> {
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
export async function writeDescriptorAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
  descriptorUUID,
  data,
}: any): Promise<any> {
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
export async function setNotifyCharacteristicAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
  shouldNotify,
}: any): Promise<NativeCharacteristic> {
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
export async function readCharacteristicAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
}: any): Promise<Base64 | null> {
  const { characteristic } = await ExpoBluetooth.readCharacteristicAsync({
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
    characteristicProperties: CharacteristicProperty.Read,
  });

  return characteristic.value;
}

/* TODO: Bacon: Add a return type */
export async function writeCharacteristicAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
  data,
}: any): Promise<NativeCharacteristic> {
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
export async function writeCharacteristicWithoutResponseAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
  data,
}: WriteCharacteristicOptions): Promise<NativeCharacteristic> {
  const { characteristic } = await ExpoBluetooth.writeCharacteristicAsync({
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
    data,
    characteristicProperties: CharacteristicProperty.WriteWithoutResponse,
  });
  return characteristic;
}

export async function readRSSIAsync(peripheralUUID: UUID): Promise<number> {
  invariantAvailability('readRSSIAsync');
  invariantUUID(peripheralUUID);
  return await ExpoBluetooth.readRSSIAsync(peripheralUUID);
}

export async function getPeripheralsAsync(): Promise<any[]> {
  invariantAvailability('getPeripheralsAsync');
  return await ExpoBluetooth.getPeripheralsAsync();
}

export async function getConnectedPeripheralsAsync(
  serviceUUIDsToQuery: UUID[] = []
): Promise<NativePeripheral[]> {
  invariantAvailability('getConnectedPeripheralsAsync');
  return await ExpoBluetooth.getConnectedPeripheralsAsync(serviceUUIDsToQuery);
}

export async function getCentralAsync(): Promise<any> {
  invariantAvailability('getCentralAsync');
  return await ExpoBluetooth.getCentralAsync();
}

export async function getPeripheralAsync({ peripheralUUID }): Promise<any[]> {
  invariantAvailability('getPeripheralAsync');
  return await ExpoBluetooth.getPeripheralAsync({ peripheralUUID });
}
export async function getServiceAsync({ peripheralUUID, serviceUUID }): Promise<any[]> {
  invariantAvailability('getServiceAsync');
  return await ExpoBluetooth.getServiceAsync({ peripheralUUID, serviceUUID });
}
export async function getCharacteristicAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
}): Promise<any[]> {
  invariantAvailability('getCharacteristicAsync');
  return await ExpoBluetooth.getCharacteristicAsync({
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
  });
}

export async function getDescriptorAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
  descriptorUUID,
}): Promise<any[]> {
  invariantAvailability('getDescriptorAsync');
  return await ExpoBluetooth.getDescriptorAsync({
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
    descriptorUUID,
  });
}

export async function isScanningAsync(): Promise<any> {
  const { isScanning, ...props } = await getCentralAsync();
  console.log('central', isScanning, props);
  return isScanning;
}

// TODO: Bacon: Add serviceUUIDs
export async function discoverServicesForPeripheralAsync(options: {
  id: string;
  serviceUUIDs?: UUID[];
  characteristicProperties?: CharacteristicProperty;
}): Promise<{ peripheral: NativePeripheral }> {
  invariantAvailability('discoverServicesForPeripheralAsync');
  const transaction = Transaction.fromTransactionId(options.id);
  return await ExpoBluetooth.discoverServicesForPeripheralAsync({
    ...transaction.getUUIDs(),
    serviceUUIDs: options.serviceUUIDs,
    characteristicProperties: options.characteristicProperties,
  });
}

export async function discoverIncludedServicesForServiceAsync(options: {
  id: string;
  serviceUUIDs?: UUID[];
}): Promise<{ peripheral: NativePeripheral }> {
  invariantAvailability('discoverIncludedServicesForServiceAsync');
  const transaction = Transaction.fromTransactionId(options.id);
  return await ExpoBluetooth.discoverIncludedServicesForServiceAsync({
    ...transaction.getUUIDs(),
    serviceUUIDs: options.serviceUUIDs,
  });
}

export async function discoverCharacteristicsForServiceAsync(options: {
  id: string;
  serviceUUIDs?: UUID[];
  characteristicProperties?: CharacteristicProperty;
}): Promise<{ service: NativeService }> {
  invariantAvailability('discoverCharacteristicsForServiceAsync');
  const transaction = Transaction.fromTransactionId(options.id);
  return await ExpoBluetooth.discoverCharacteristicsForServiceAsync({
    ...transaction.getUUIDs(),
    serviceUUIDs: options.serviceUUIDs,
    characteristicProperties: options.characteristicProperties,
  });
}

export async function discoverDescriptorsForCharacteristicAsync(options: {
  id: string;
  serviceUUIDs?: UUID[];
  characteristicProperties?: CharacteristicProperty;
}): Promise<{ peripheral: NativePeripheral; characteristic: NativeCharacteristic }> {
  invariantAvailability('discoverDescriptorsForCharacteristicAsync');
  const transaction = Transaction.fromTransactionId(options.id);
  return await ExpoBluetooth.discoverDescriptorsForCharacteristicAsync({
    ...transaction.getUUIDs(),
    serviceUUIDs: options.serviceUUIDs,
    characteristicProperties: options.characteristicProperties,
  });
  // return await discoverAsync({ id });
}

export async function loadPeripheralAsync(
  { id },
  skipConnecting: boolean = false
): Promise<NativePeripheral> {
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
    } else {
      // This should never be called because in theory connectAsync would throw an error.
    }
  } else if (peripheral.state === 'connected') {
    console.log('loadPeripheralAsync(): _loadChildrenRecursivelyAsync!');
    await _loadChildrenRecursivelyAsync({ id: peripheralId });
  }

  // In case any updates occured during this function.
  return getPeripherals()[peripheralId];
}

export async function _loadChildrenRecursivelyAsync({ id }): Promise<any[]> {
  const components = id.split(DELIMINATOR);
  console.log({ components });
  if (components.length === 4) {
    // Descriptor ID
    throw new Error('Descriptors have no children');
  } else if (components.length === 3) {
    // Characteristic ID
    console.log('Load Characteristic ', id);
    // DEBUG

    // console.warn('DISABLE ME');
    // return [];
    const {
      characteristic: { descriptors },
    } = await discoverDescriptorsForCharacteristicAsync({ id });
    return descriptors;
  } else if (components.length === 2) {
    // Service ID
    console.log('Load Service ', id);
    const { service } = await discoverCharacteristicsForServiceAsync({ id });
    console.log('LOADED CHARACTERISTICS FROM SERVICE', service);
    return await Promise.all(
      service.characteristics.map(characteristic => _loadChildrenRecursivelyAsync(characteristic))
    );
  } else if (components.length === 1) {
    // Peripheral ID
    console.log('Load Peripheral ', id);
    const {
      peripheral: { services },
    } = await discoverServicesForPeripheralAsync({ id });
    return await Promise.all(services.map(service => _loadChildrenRecursivelyAsync(service)));
  } else {
    throw new Error(`Unknown ID ${id}`);
  }
}

const android = {
  async requestMTUAsync(peripheralUUID: UUID, MTU: number): Promise<number> {
    invariantAvailability('requestMTUAsync');
    invariantUUID(peripheralUUID);
    if (MTU > 512) {
      throw new Error('expo-bluetooth: Max MTU size is 512');
    }
    return await ExpoBluetooth.requestMTUAsync(peripheralUUID, MTU);
  },
  async bondAsync(peripheralUUID: UUID): Promise<any> {
    invariantAvailability('bondAsync');
    invariantUUID(peripheralUUID);
    return await ExpoBluetooth.bondAsync(peripheralUUID);
  },
  async unbondAsync(peripheralUUID: UUID): Promise<any> {
    invariantAvailability('unbondAsync');
    invariantUUID(peripheralUUID);
    return await ExpoBluetooth.unbondAsync(peripheralUUID);
  },
  async enableBluetoothAsync(isBluetoothEnabled: boolean): Promise<void> {
    invariantAvailability('enableBluetoothAsync');
    return await ExpoBluetooth.enableBluetoothAsync(isBluetoothEnabled);
  },
  async getBondedPeripheralsAsync(): Promise<NativePeripheral[]> {
    invariantAvailability('getBondedPeripheralsAsync');
    return await ExpoBluetooth.getBondedPeripheralsAsync();
  },
  async requestConnectionPriorityAsync(
    peripheralUUID: UUID,
    connectionPriority: Priority
  ): Promise<any> {
    invariantAvailability('requestConnectionPriorityAsync');
    invariantUUID(peripheralUUID);
    return await ExpoBluetooth.requestConnectionPriorityAsync(peripheralUUID, connectionPriority);
  },
  observeBluetoothAvailabilty(callback: (updates: Central) => void): Subscription {
    return addHandlerForKey(EVENTS.SYSTEM_AVAILABILITY_CHANGED, callback);
  },
  observeBluetoothEnabled(callback: (updates: Central) => void): Subscription {
    return addHandlerForKey(EVENTS.SYSTEM_ENABLED_STATE_CHANGED, callback);
  },
};

export { android };

export async function _reset(): Promise<void> {
  await stopScanningAsync();
  clearPeripherals();
  await _resetAllHandlers();
}

let lastEvent;
addListener(({ data, event }: { data: NativeEventData; event: string }) => {
  const { peripheral, peripherals, central, advertisementData, RSSI, error } = data;

  console.log('Event: ' + event + (lastEvent ? ', last: ' + lastEvent : ''));
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

  switch (event) {
    case EVENTS.CENTRAL_SCAN_STARTED:
      // noop
      break;
    case EVENTS.PERIPHERAL_CONNECTED:
      console.log('Connect peripheral: ', peripheral!.id);
      break;
    case EVENTS.CENTRAL_SCAN_STOPPED:
    case EVENTS.PERIPHERAL_DISCONNECTED:
    case EVENTS.CENTRAL_DISCOVERED_PERIPHERAL:
      if (event === EVENTS.PERIPHERAL_DISCONNECTED) {
        console.log('disconnect peripheral: ', peripheral!.id);
      }
      fireMultiEventHandlers(event, { peripheral });
      if (peripheral) {
        // Send specific events for things like disconnect.
        const uid = `${event}_${peripheral.id}`;
        fireSingleEventHandlers(uid, { peripheral });
      }
      firePeripheralObservers();
      return;
    case EVENTS.CENTRAL_STATE_CHANGED:
      if (!central) {
        throw new Error('EXBluetooth: Central not defined while processing: ' + event);
      }

      for (const callback of getHandlersForKey(event)) {
        callback(central.state);
      }

      return;
    case EVENTS.SYSTEM_ENABLED_STATE_CHANGED:
      fireMultiEventHandlers(event, { central });
      return;

    default:
      throw new Error('EXBluetooth: Unhandled event: ' + event);
  }
});
