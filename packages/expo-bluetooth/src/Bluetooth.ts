import { Platform, Subscription } from 'expo-core';
import * as Permissions from 'expo-permissions';
import { PermissionStatus } from 'expo-permissions/src/Permissions.types';

import {
  Base64,
  CancelScanningCallback,
  Central,
  CentralManagerOptions,
  CharacteristicProperty,
  NativeCharacteristic,
  NativeDescriptor,
  NativeEventData,
  NativePeripheral,
  NativeService,
  ScanOptions,
  StateUpdatedCallback,
  UUID,
  PeripheralConnectionOption,
  WriteCharacteristicOptions,
} from './Bluetooth.types';
import { DELIMINATOR, EVENTS } from './BluetoothConstants';
import {
  _resetAllHandlers,
  addHandlerForID,
  addHandlerForKey,
  addListener,
  fireMultiEventHandlers,
  firePeripheralObservers,
  fireSingleEventHandlers,
  resetHandlersForKey,
} from './BluetoothEventHandler';
import { clearPeripherals, getPeripherals, updateStateWithPeripheral } from './BluetoothLocalState';
import { peripheralIdFromId } from './BluetoothTransactions';
import AndroidGATTError from './errors/AndroidGATTError';
import BluetoothError from './errors/BluetoothError';
import { invariant, invariantAvailability, invariantUUID } from './errors/BluetoothInvariant';
import ExpoBluetooth from './ExpoBluetooth';
import Transaction from './Transaction';

// TODO: Bacon maybe move to `.android`
export async function requestPermissionAsync(): Promise<{ status: PermissionStatus }> {
  if (Platform.OS === 'android') {
    return await Permissions.askAsync(Permissions.LOCATION);
  }
  return { status: PermissionStatus.GRANTED };
}

export async function getPermissionAsync(): Promise<{ status: PermissionStatus }> {
  if (Platform.OS === 'android') {
    return await Permissions.getAsync(Permissions.LOCATION);
  }
  return { status: PermissionStatus.GRANTED };
}

/**
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

/** Dangerously rebuild the manager with the given options */ 
export async function initAsync(options: CentralManagerOptions): Promise<void> {
  invariantAvailability('initAsync');
  await _reset();
  await ExpoBluetooth.initAsync(options);
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

export async function observeCentralStateAsync(callback: StateUpdatedCallback): Promise<Subscription> {
  const central = await getCentralAsync();
  // Make the callback async so the subscription returns first.
  setTimeout(() => callback(central.state));
  return addHandlerForKey(EVENTS.CENTRAL_STATE_CHANGED, ({ central = {} }) => callback(central.state) );
}

type ConnectionOptions = {
  timeout?: number;
  options?: PeripheralConnectionOption;
  onDisconnect?: (...args:any[]) => any;
}

export async function connectAsync(
  peripheralUUID: UUID,
  { timeout, options = {}, onDisconnect }: ConnectionOptions
): Promise<NativePeripheral> {
  invariantAvailability('connectPeripheralAsync');
  invariantUUID(peripheralUUID);

  if (onDisconnect) {
    addHandlerForID(EVENTS.PERIPHERAL_DISCONNECTED, peripheralUUID, onDisconnect);
  }

  let timeoutTag: number | undefined;

  return new Promise(async (resolve, reject) => {
    if (timeout) {
      timeoutTag = setTimeout(() => {
        disconnectAsync(peripheralUUID);
        reject(
          new BluetoothError({
            message: `Failed to connect to peripheral: ${peripheralUUID} in under: ${
              timeout
            }ms`,
            code: 'ERR_BLE_TIMEOUT',
          })
        );
      }, timeout);
    }
    
    try {
      const result = await ExpoBluetooth.connectPeripheralAsync(peripheralUUID, options || {});
      clearTimeout(timeoutTag);
      resolve(result);
      return;
    } catch (error) {
      clearTimeout(timeoutTag);
      reject(error);
      return;
    }
  });
}

/** This method will also cancel pending connections */
export async function disconnectAsync(peripheralUUID: UUID): Promise<any> {
  invariantAvailability('disconnectPeripheralAsync');
  invariantUUID(peripheralUUID);
  return await ExpoBluetooth.disconnectPeripheralAsync(peripheralUUID);
}

export async function readDescriptorAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
  descriptorUUID,
}: any): Promise<Base64 | null> {
  invariantAvailability('readDescriptorAsync');

  const { descriptor } = await ExpoBluetooth.readDescriptorAsync({
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
    descriptorUUID,
    characteristicProperties: CharacteristicProperty.Read,
  });

  return descriptor.value;
}

export async function writeDescriptorAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
  descriptorUUID,
  data,
}: any): Promise<NativeDescriptor> {
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
  invariantAvailability('readCharacteristicAsync');

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
  invariantAvailability('writeCharacteristicAsync');

  const { characteristic } = await ExpoBluetooth.writeCharacteristicAsync({
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
    data,
    characteristicProperties: CharacteristicProperty.Write,
  });

  return characteristic;
}

// This is ~3x faster on Android.
export async function writeCharacteristicWithoutResponseAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
  data,
}: WriteCharacteristicOptions): Promise<NativeCharacteristic> {
  invariantAvailability('writeCharacteristicAsync');

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

export async function getPeripheralsAsync(): Promise<NativePeripheral[]> {
  invariantAvailability('getPeripheralsAsync');
  return await ExpoBluetooth.getPeripheralsAsync();
}

export async function getConnectedPeripheralsAsync(
  serviceUUIDsToQuery: UUID[] = []
): Promise<NativePeripheral[]> {
  invariantAvailability('getConnectedPeripheralsAsync');
  return await ExpoBluetooth.getConnectedPeripheralsAsync(serviceUUIDsToQuery);
}

export async function getCentralAsync(): Promise<Central> {
  invariantAvailability('getCentralAsync');
  return await ExpoBluetooth.getCentralAsync();
}

export async function getPeripheralAsync({ peripheralUUID }): Promise<NativePeripheral> {
  invariantAvailability('getPeripheralAsync');
  return await ExpoBluetooth.getPeripheralAsync({ peripheralUUID });
}

export async function getServiceAsync({ peripheralUUID, serviceUUID }): Promise<NativeService> {
  invariantAvailability('getServiceAsync');
  return await ExpoBluetooth.getServiceAsync({ peripheralUUID, serviceUUID });
}

export async function getCharacteristicAsync({
  peripheralUUID,
  serviceUUID,
  characteristicUUID,
}): Promise<NativeCharacteristic> {
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
}): Promise<NativeDescriptor> {
  invariantAvailability('getDescriptorAsync');
  return await ExpoBluetooth.getDescriptorAsync({
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
    descriptorUUID,
  });
}

export async function isScanningAsync(): Promise<boolean> {
  const { isScanning } = await getCentralAsync();
  return isScanning;
}

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
}

export async function loadPeripheralAsync(
  { id },
  skipConnecting: boolean = false
): Promise<NativePeripheral> {
  const peripheralId = peripheralIdFromId(id);
  const peripheral = getPeripherals()[peripheralId];
  if (!peripheral) {
    throw new BluetoothError({ code: 'ERR_BLE_LOADING', message: 'Not a peripheral ' + peripheralId});
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
  } else if (peripheral.state === 'connected') {
    console.log('loadPeripheralAsync(): _loadChildrenRecursivelyAsync!');
    await _loadChildrenRecursivelyAsync({ id: peripheralId });
  }
  console.log('loadPeripheralAsync(): fully loaded');

  // In case any updates occured during this function.
  return getPeripherals()[peripheralId];
}

// Internal Methods

export async function _loadChildrenRecursivelyAsync({ id }: { id: string }): Promise<any[]> {
  const components = id.split(DELIMINATOR);
  if (components.length === 4) {
    // Descriptor ID
    throw new BluetoothError({ code: `ERR_BLE_LOADING`, message: 'Descriptors have no children'});
  } else if (components.length === 3) {
    // Characteristic ID
    const {
      characteristic: { descriptors },
    } = await discoverDescriptorsForCharacteristicAsync({ id });
    return descriptors;
  } else if (components.length === 2) {
    // Service ID
    const { service } = await discoverCharacteristicsForServiceAsync({ id });
    return await Promise.all(
      service.characteristics.map(characteristic => _loadChildrenRecursivelyAsync(characteristic))
    );
  } else if (components.length === 1) {
    // Peripheral ID
    const {
      peripheral: { services },
    } = await discoverServicesForPeripheralAsync({ id });
    return await Promise.all(services.map(service => _loadChildrenRecursivelyAsync(service)));
  } else {
    throw new BluetoothError({ code: `ERR_BLE_LOADING`, message: `Unknown ID ${id}`});
  }
}

export async function _reset(): Promise<void> {
  await stopScanningAsync();
  clearPeripherals();
  await _resetAllHandlers();
}

export function _getGATTStatusError(code, invokedMethod, stack = undefined) {
  const nStack = stack || new Error().stack;
  if (code.indexOf('ERR_BLE_GATT:') > -1 ) {
    const gattStatusCode = code.split(':')[1];
    return new AndroidGATTError({ gattStatusCode, stack: nStack, invokedMethod });
  } 
  return null;
}

addListener(({ data, event }: { data: NativeEventData; event: string }) => {
  const { peripheral, peripherals, central, error } = data;

  if (event === EVENTS.UPDATE_STATE) {
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
      // throw new BluetoothError({ message: 'Unhandled event: ' + event, code: 'ERR_BLE_UNHANDLED_EVENT'});
    return;
  }
});
