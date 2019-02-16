import BluetoothPlatformError from './errors/BluetoothPlatformError';
import AndroidGATTError from './errors/AndroidGATTError';
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
import { invariantAvailability, invariant, invariantUUID } from './errors/BluetoothInvariant';
import { clearPeripherals, getPeripherals, updateStateWithPeripheral } from './BluetoothLocalState';
import { peripheralIdFromId } from './BluetoothTransactions';
import ExpoBluetoothModule from './ExpoBluetooth';
import Transaction from './Transaction';

import BluetoothError from './errors/BluetoothError';

export * from './Bluetooth.types';

export { default as AndroidGATTError } from './errors/AndroidGATTError';
export { default as BluetoothError } from './errors/BluetoothError';
export { default as BluetoothInvariant } from './errors/BluetoothInvariant';
export { default as BluetoothPlatformError } from './errors/BluetoothPlatformError';

function platformModuleWithCustomErrors(platformModule: { [property: string]: any } ): { [property: string]: any } {
  const platform = {};
  for (const property of Object.keys(platformModule)) {
    if (typeof platformModule[property] !== 'function') {
      Object.defineProperty(platform, property, {
        get() {
          return platformModule[property];
        }
      });
    } else {
      platform[property] = methodWithTransformedError(platformModule[property], property);
    }
  }
  Object.freeze(platform);
  return platform;
}

function methodWithTransformedError(method: (...props:any[]) => Promise<any>, methodName: string): ((...props: any[]) => Promise<any>) {
  /** Stack trace without async layers */
  const stack = decodeURI(new Error().stack || "");
  return async (...props: any[]): Promise<any> => {
    try {
      console.log(`EXBLE: invoke: ${methodName}()`);
      return await method(...props);
    } catch ({ message, code, ...props }) {
      let error;
      if (code.indexOf('ERR_BLE_GATT:') > -1 ) {
        const gattStatusCode = code.split(':')[1];
        error = new AndroidGATTError({ gattStatusCode: parseInt(gattStatusCode), stack, invokedMethod: methodName });
      } 
      error = new BluetoothPlatformError({ message, code, ...props, invokedMethod: methodName, stack });

      error.log();
      throw error;
    }
  };
}

export function _getGATTStatusError(code, invokedMethod, stack = undefined) {
  const nStack = stack || new Error().stack;
  if (code.indexOf('ERR_BLE_GATT:') > -1 ) {
    const gattStatusCode = code.split(':')[1];
    return new AndroidGATTError({ gattStatusCode, stack: nStack, invokedMethod });
  } 
  return null;
}

const ExpoBluetooth = platformModuleWithCustomErrors(ExpoBluetoothModule);

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

// export function observeScanningErrors(callback: (updates: any) => void): Subscription {
//   return addHandlerForKey(EVENTS.CENTRAL_SCAN_STOPPED, callback);
// }

export async function observeStateAsync(callback: StateUpdatedCallback): Promise<Subscription> {
  const central = await getCentralAsync();
  // Make the callback async so the subscription returns first.
  setTimeout(() => callback(central.state));
  return addHandlerForKey(EVENTS.CENTRAL_STATE_CHANGED, ({ central = {} }) => callback(central.state) );
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
            code: 'ERR_BLE_TIMEOUT',
          })
        );
      }, options.timeout);
    }
    
    try {
      const result = await ExpoBluetooth.connectPeripheralAsync(peripheralUUID, options.options);
      console.log("API:INTERNAL:connectPeripheralAsync.resolved", result)
      clearTimeout(timeoutTag);
      resolve(result);
      return;
    } catch (error) {
      console.log("API:INTERNAL:connectPeripheralAsync.rejected", error)
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
  const { isScanning } = await getCentralAsync();
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
  console.log("discoverServicesForPeripheralAsync: Before Native: ", options)
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

export async function _loadChildrenRecursivelyAsync({ id }): Promise<any[]> {
  const components = id.split(DELIMINATOR);
  console.log('_loadChildrenRecursivelyAsync(): components', components);
  // console.log({ components });
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
    console.log('discoverServicesForPeripheralAsync(): ', services);
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
      throw new BluetoothError({ message: 'Max MTU size is 512', code: 'ERR_BLE_MTU' });
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
  } else {
    console.log('Event: ' + event + ((lastEvent && lastEvent !== event) ? ', last: ' + lastEvent : ''));
    lastEvent = event;
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
      console.log('Connect peripheral: ', peripheral!.id);
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
      throw new BluetoothError({ message: 'Unhandled event: ' + event, code: 'ERR_BLE_UNHANDLED_EVENT'});
  }
});
