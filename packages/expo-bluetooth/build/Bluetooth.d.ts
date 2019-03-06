import { Subscription } from 'expo-core';
import { Base64, CancelScanningCallback, Central, CentralManagerOptions, CharacteristicProperty, ConnectionOptions, Characteristic, Descriptor, PeripheralConnectionOption, Service, Peripheral, RSSI, ScanOptions, StateUpdatedCallback, UUID, WriteCharacteristicOptions, ReadCharacteristicOptions } from './Bluetooth.types';
import { AndroidGATTError } from './errors';
/**
 * Although strongly discouraged,
 * if `serviceUUIDsToQuery` is `null | undefined` all discovered peripherals will be returned.
 * If the central is already scanning with different
 * `serviceUUIDsToQuery` or `scanSettings`, the provided parameters will replace them.
 */
export declare function startScanningAsync(scanSettings: ScanOptions | undefined, callback: (peripheral: Peripheral) => void): Promise<CancelScanningCallback>;
/** Dangerously rebuild the manager with the given options */
export declare function initAsync(options: CentralManagerOptions): Promise<void>;
export declare function stopScanningAsync(): Promise<void>;
export declare function observeUpdates(callback: (updates: any) => void): Subscription;
export declare function observeCentralStateAsync(callback: StateUpdatedCallback): Promise<Subscription>;
export declare function connectAsync(peripheralUUID: UUID, { timeout, onDisconnect }: ConnectionOptions, options?: PeripheralConnectionOption): Promise<Peripheral>;
/** This method will also cancel pending connections */
export declare function disconnectAsync(peripheralUUID: UUID): Promise<any>;
export declare function readDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, }: any): Promise<Base64 | null>;
export declare function writeDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, data, }: any): Promise<Descriptor>;
export declare function setNotifyCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, shouldNotify, }: any): Promise<Characteristic>;
export declare function readCharacteristicAsync(options: ReadCharacteristicOptions): Promise<Base64 | null>;
export declare function writeCharacteristicAsync(options: WriteCharacteristicOptions, characteristicProperties?: CharacteristicProperty): Promise<Characteristic>;
export declare function writeCharacteristicWithoutResponseAsync(options: WriteCharacteristicOptions): Promise<Characteristic>;
export declare function readRSSIAsync(peripheralUUID: UUID): Promise<RSSI>;
export declare function getPeripheralsAsync(): Promise<Peripheral[]>;
export declare function getConnectedPeripheralsAsync(serviceUUIDsToQuery?: UUID[]): Promise<Peripheral[]>;
export declare function getCentralAsync(): Promise<Central>;
export declare function getPeripheralAsync({ peripheralUUID }: {
    peripheralUUID: any;
}): Promise<Peripheral>;
export declare function getServiceAsync({ peripheralUUID, serviceUUID }: {
    peripheralUUID: any;
    serviceUUID: any;
}): Promise<Service>;
export declare function getCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, }: {
    peripheralUUID: any;
    serviceUUID: any;
    characteristicUUID: any;
}): Promise<Characteristic>;
export declare function getDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, }: {
    peripheralUUID: any;
    serviceUUID: any;
    characteristicUUID: any;
    descriptorUUID: any;
}): Promise<Descriptor>;
export declare function isScanningAsync(): Promise<boolean>;
export declare function discoverServicesForPeripheralAsync(options: {
    id: string;
    serviceUUIDs?: UUID[];
    characteristicProperties?: CharacteristicProperty;
}): Promise<Service[]>;
export declare function discoverIncludedServicesForServiceAsync(options: {
    id: string;
    serviceUUIDs?: UUID[];
}): Promise<Service[]>;
export declare function discoverCharacteristicsForServiceAsync(options: {
    id: string;
    serviceUUIDs?: UUID[];
    characteristicProperties?: CharacteristicProperty;
}): Promise<Characteristic[]>;
export declare function discoverDescriptorsForCharacteristicAsync(options: {
    id: string;
    serviceUUIDs?: UUID[];
    characteristicProperties?: CharacteristicProperty;
}): Promise<Descriptor[]>;
export declare function loadPeripheralAsync({ id }: {
    id: any;
}, skipConnecting?: boolean): Promise<Peripheral>;
export declare function _loadChildrenRecursivelyAsync({ id }: {
    id: string;
}): Promise<any[]>;
export declare function _reset(): Promise<void>;
export declare function _getGATTStatusError(code: any, invokedMethod: any, stack?: undefined): AndroidGATTError | null;
