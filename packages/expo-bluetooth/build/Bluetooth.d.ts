import { Subscription } from 'expo-core';
import { PeripheralInterface, ServiceInterface, CharacteristicInterface, ScanSettings, StateUpdatedCallback, UUID, WriteOptions } from './Bluetooth.types';
export declare const Events: any;
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
export declare function readAsync(options: WriteOptions): Promise<any>;
export declare function writeAsync(options: WriteOptions): Promise<any>;
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
