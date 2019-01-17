import { Subscription } from 'expo-core';
import { CentralState, PeripheralState, Base64, UUID, Identifier, TransactionId, NodeInterface, DescriptorInterface, NativeEventData, ErrorInterface, CharacteristicInterface, ServiceInterface, AdvertismentDataInterface, PeripheralInterface, TransactionType, PeripheralFoundCallback, StateUpdatedCallback, ScanSettings, Central, CharacteristicProperty } from './Bluetooth.types';
export { CentralState, PeripheralState, Base64, UUID, Identifier, TransactionId, NodeInterface, DescriptorInterface, NativeEventData, ErrorInterface, CharacteristicInterface, ServiceInterface, AdvertismentDataInterface, PeripheralInterface, TransactionType, PeripheralFoundCallback, StateUpdatedCallback, ScanSettings, Central, CharacteristicProperty, };
export declare const EVENTS: any;
export declare function startScanAsync(scanSettings?: ScanSettings): Promise<Subscription>;
export declare function stopScanAsync(): Promise<void>;
export declare function observeUpdatesAsync(callback: (updates: any) => void): Promise<Subscription>;
export declare function observeStateAsync(callback: StateUpdatedCallback): Promise<Subscription>;
export declare function connectAsync(options: {
    uuid: string;
    timeout?: number;
    options?: any;
}): Promise<PeripheralInterface>;
export declare function disconnectAsync(options: {
    uuid: string;
}): Promise<any>;
export declare function readDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }: any): Promise<Base64 | undefined>;
export declare function writeDescriptorAsync({ peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID, data }: any): Promise<any>;
export declare function readCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID }: any): Promise<Base64 | null>;
export declare function writeCharacteristicAsync({ peripheralUUID, serviceUUID, characteristicUUID, data }: any): Promise<any>;
export declare function writeCharacteristicWithoutResponseAsync({ peripheralUUID, serviceUUID, characteristicUUID, data }: any): Promise<any>;
export declare function readRSSIAsync(peripheralUUID: UUID): Promise<any>;
export declare function getPeripheralsAsync(): Promise<any[]>;
export declare function getPeripherals(): any;
export declare function getPeripheralForId(id: string): any;
export declare function getCentralAsync(): Promise<any>;
export declare function isScanningAsync(): Promise<any>;
export declare function discoverServicesForPeripheralAsync(options: {
    id: string;
    serviceUUIDsToQuery?: UUID[];
}): Promise<{
    peripheral: PeripheralInterface;
}>;
export declare function discoverCharacteristicsForServiceAsync({ id, }: {
    id: any;
}): Promise<{
    service: ServiceInterface;
}>;
export declare function discoverDescriptorsForCharacteristicAsync({ id, }: {
    id: any;
}): Promise<{
    peripheral: PeripheralInterface;
    characteristic: CharacteristicInterface;
}>;
export declare function loadPeripheralAsync({ id }: {
    id: any;
}, skipConnecting?: boolean): Promise<PeripheralInterface>;
export declare function loadChildrenRecursivelyAsync({ id }: {
    id: any;
}): Promise<Array<any>>;
