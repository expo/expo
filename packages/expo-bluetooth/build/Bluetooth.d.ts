import { Subscription } from 'expo-core';
import { Base64, Central, CentralState, CharacteristicProperty, Identifier, NativeAdvertismentData, NativeBluetoothElement, NativeCharacteristic, NativeDescriptor, NativeError, NativeEventData, NativePeripheral, NativeService, PeripheralFoundCallback, PeripheralState, ScanSettings, StateUpdatedCallback, TransactionId, TransactionType, UUID, WriteCharacteristicOptions } from './Bluetooth.types';
import { BLUETOOTH_EVENT, EVENTS, TYPES } from './BluetoothConstants';
export { CentralState, PeripheralState, Base64, UUID, Identifier, TransactionId, NativeBluetoothElement, NativeDescriptor, NativeEventData, NativeError, NativeCharacteristic, NativeService, NativeAdvertismentData, NativePeripheral, TransactionType, PeripheralFoundCallback, StateUpdatedCallback, ScanSettings, Central, CharacteristicProperty, };
export { BLUETOOTH_EVENT, TYPES, EVENTS };
export declare function startScanAsync(scanSettings?: ScanSettings): Promise<Subscription>;
export declare function stopScanAsync(): Promise<void>;
export declare function observeUpdatesAsync(callback: (updates: any) => void): Promise<Subscription>;
export declare function observeStateAsync(callback: StateUpdatedCallback): Promise<Subscription>;
export declare function connectAsync(peripheralUUID: UUID, options?: {
    timeout?: number;
    options?: any;
    onDisconnect?: any;
}): Promise<NativePeripheral>;
export declare function disconnectAsync(peripheralUUID: UUID): Promise<any>;
export declare function readDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, }: any): Promise<Base64 | undefined>;
export declare function writeDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, data, }: any): Promise<any>;
export declare function shouldNotifyDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, shouldNotify, }: any): Promise<any>;
export declare function readCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, }: any): Promise<Base64 | null>;
export declare function writeCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, data, }: any): Promise<NativeCharacteristic>;
export declare function writeCharacteristicWithoutResponseAsync({ peripheralUUID, serviceUUID, characteristicUUID, data, }: WriteCharacteristicOptions): Promise<NativeCharacteristic>;
export declare function readRSSIAsync(peripheralUUID: UUID): Promise<number>;
export declare function requestMTUAsync(peripheralUUID: UUID, MTU: number): Promise<number>;
export declare function getPeripheralsAsync(): Promise<any[]>;
export declare function getCentralAsync(): Promise<any>;
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
export declare function loadChildrenRecursivelyAsync({ id }: {
    id: any;
}): Promise<any[]>;
