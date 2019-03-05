import { Subscription } from 'expo-core';
import { PermissionStatus } from 'expo-permissions/src/Permissions.types';
import { Base64, CancelScanningCallback, Central, CentralManagerOptions, CharacteristicProperty, NativeCharacteristic, NativeDescriptor, NativePeripheral, NativeService, ScanOptions, StateUpdatedCallback, UUID, ConnectionOptions, WriteCharacteristicOptions, RSSI } from './Bluetooth.types';
import AndroidGATTError from './errors/AndroidGATTError';
export declare function requestPermissionAsync(): Promise<{
    status: PermissionStatus;
}>;
export declare function getPermissionAsync(): Promise<{
    status: PermissionStatus;
}>;
/**
 * Although strongly discouraged,
 * if `serviceUUIDsToQuery` is `null | undefined` all discovered peripherals will be returned.
 * If the central is already scanning with different
 * `serviceUUIDsToQuery` or `scanSettings`, the provided parameters will replace them.
 */
export declare function startScanningAsync(scanSettings: ScanOptions | undefined, callback: (peripheral: NativePeripheral) => void): Promise<CancelScanningCallback>;
/** Dangerously rebuild the manager with the given options */
export declare function initAsync(options: CentralManagerOptions): Promise<void>;
export declare function stopScanningAsync(): Promise<void>;
export declare function observeUpdates(callback: (updates: any) => void): Subscription;
export declare function observeCentralStateAsync(callback: StateUpdatedCallback): Promise<Subscription>;
export declare function connectAsync(peripheralUUID: UUID, { timeout, options, onDisconnect }: ConnectionOptions): Promise<NativePeripheral>;
/** This method will also cancel pending connections */
export declare function disconnectAsync(peripheralUUID: UUID): Promise<any>;
export declare function readDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, }: any): Promise<Base64 | null>;
export declare function writeDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, data, }: any): Promise<NativeDescriptor>;
export declare function setNotifyCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, shouldNotify, }: any): Promise<NativeCharacteristic>;
export declare function readCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, }: any): Promise<Base64 | null>;
export declare function writeCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, data, }: any): Promise<NativeCharacteristic>;
export declare function writeCharacteristicWithoutResponseAsync({ peripheralUUID, serviceUUID, characteristicUUID, data, }: WriteCharacteristicOptions): Promise<NativeCharacteristic>;
export declare function readRSSIAsync(peripheralUUID: UUID): Promise<RSSI>;
export declare function getPeripheralsAsync(): Promise<NativePeripheral[]>;
export declare function getConnectedPeripheralsAsync(serviceUUIDsToQuery?: UUID[]): Promise<NativePeripheral[]>;
export declare function getCentralAsync(): Promise<Central>;
export declare function getPeripheralAsync({ peripheralUUID }: {
    peripheralUUID: any;
}): Promise<NativePeripheral>;
export declare function getServiceAsync({ peripheralUUID, serviceUUID }: {
    peripheralUUID: any;
    serviceUUID: any;
}): Promise<NativeService>;
export declare function getCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, }: {
    peripheralUUID: any;
    serviceUUID: any;
    characteristicUUID: any;
}): Promise<NativeCharacteristic>;
export declare function getDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, }: {
    peripheralUUID: any;
    serviceUUID: any;
    characteristicUUID: any;
    descriptorUUID: any;
}): Promise<NativeDescriptor>;
export declare function isScanningAsync(): Promise<boolean>;
export declare function discoverServicesForPeripheralAsync(options: {
    id: string;
    serviceUUIDs?: UUID[];
    characteristicProperties?: CharacteristicProperty;
}): Promise<{
    peripheral: NativePeripheral;
}>;
export declare function discoverIncludedServicesForServiceAsync(options: {
    id: string;
    serviceUUIDs?: UUID[];
}): Promise<{
    peripheral: NativePeripheral;
}>;
export declare function discoverCharacteristicsForServiceAsync(options: {
    id: string;
    serviceUUIDs?: UUID[];
    characteristicProperties?: CharacteristicProperty;
}): Promise<{
    service: NativeService;
}>;
export declare function discoverDescriptorsForCharacteristicAsync(options: {
    id: string;
    serviceUUIDs?: UUID[];
    characteristicProperties?: CharacteristicProperty;
}): Promise<{
    peripheral: NativePeripheral;
    characteristic: NativeCharacteristic;
}>;
export declare function loadPeripheralAsync({ id }: {
    id: any;
}, skipConnecting?: boolean): Promise<NativePeripheral>;
export declare function _loadChildrenRecursivelyAsync({ id }: {
    id: string;
}): Promise<any[]>;
export declare function _reset(): Promise<void>;
export declare function _getGATTStatusError(code: any, invokedMethod: any, stack?: undefined): AndroidGATTError | null;
