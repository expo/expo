import { Subscription } from 'expo-core';
import { Base64, Priority, Central, CharacteristicProperty, NativeCharacteristic, NativePeripheral, NativeService, StateUpdatedCallback, UUID, WriteCharacteristicOptions } from './Bluetooth.types';
import { BLUETOOTH_EVENT, EVENTS, TYPES } from './BluetoothConstants';
export * from './Bluetooth.types';
export { BLUETOOTH_EVENT, TYPES, EVENTS };
declare type ScanOptions = {
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
declare type CancelScanningCallback = () => void;
/**
 * **iOS:**
 *
 * Although strongly discouraged,
 * if `serviceUUIDsToQuery` is `null | undefined` all discovered peripherals will be returned.
 * If the central is already scanning with different
 * `serviceUUIDsToQuery` or `scanSettings`, the provided parameters will replace them.
 */
export declare function startScanningAsync(scanSettings: ScanOptions | undefined, callback: (peripheral: NativePeripheral) => void): Promise<CancelScanningCallback>;
export declare function stopScanningAsync(): Promise<void>;
export declare function observeUpdates(callback: (updates: any) => void): Subscription;
export declare function observeScanningErrors(callback: (updates: any) => void): Subscription;
export declare function observeStateAsync(callback: StateUpdatedCallback): Promise<Subscription>;
export declare function connectAsync(peripheralUUID: UUID, options?: {
    timeout?: number;
    options?: any;
    onDisconnect?: any;
}): Promise<NativePeripheral>;
/** This method will also cancel pending connections */
export declare function disconnectAsync(peripheralUUID: UUID): Promise<any>;
export declare function readDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, }: any): Promise<Base64 | undefined>;
export declare function writeDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, data, }: any): Promise<any>;
export declare function setNotifyCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, shouldNotify, }: any): Promise<NativeCharacteristic>;
export declare function readCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, }: any): Promise<Base64 | null>;
export declare function writeCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, data, }: any): Promise<NativeCharacteristic>;
export declare function writeCharacteristicWithoutResponseAsync({ peripheralUUID, serviceUUID, characteristicUUID, data, }: WriteCharacteristicOptions): Promise<NativeCharacteristic>;
export declare function readRSSIAsync(peripheralUUID: UUID): Promise<number>;
export declare function getPeripheralsAsync(): Promise<any[]>;
export declare function getConnectedPeripheralsAsync(serviceUUIDsToQuery?: UUID[]): Promise<NativePeripheral[]>;
export declare function getCentralAsync(): Promise<any>;
export declare function getPeripheralAsync({ peripheralUUID }: {
    peripheralUUID: any;
}): Promise<any[]>;
export declare function getServiceAsync({ peripheralUUID, serviceUUID }: {
    peripheralUUID: any;
    serviceUUID: any;
}): Promise<any[]>;
export declare function getCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, }: {
    peripheralUUID: any;
    serviceUUID: any;
    characteristicUUID: any;
}): Promise<any[]>;
export declare function getDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, }: {
    peripheralUUID: any;
    serviceUUID: any;
    characteristicUUID: any;
    descriptorUUID: any;
}): Promise<any[]>;
export declare function isScanningAsync(): Promise<any>;
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
    id: any;
}): Promise<any[]>;
declare const android: {
    requestMTUAsync(peripheralUUID: string, MTU: number): Promise<number>;
    bondAsync(peripheralUUID: string): Promise<any>;
    unbondAsync(peripheralUUID: string): Promise<any>;
    enableBluetoothAsync(isBluetoothEnabled: boolean): Promise<void>;
    getBondedPeripheralsAsync(): Promise<NativePeripheral[]>;
    requestConnectionPriorityAsync(peripheralUUID: string, connectionPriority: Priority): Promise<any>;
    observeBluetoothAvailabilty(callback: (updates: Central) => void): Subscription;
    observeBluetoothEnabled(callback: (updates: Central) => void): Subscription;
};
export { android };
export declare function _reset(): Promise<void>;
