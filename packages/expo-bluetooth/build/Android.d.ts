import { Subscription } from 'expo-core';
import { Central, NativePeripheral, Priority, UUID } from './Bluetooth.types';
export declare function requestMTUAsync(peripheralUUID: UUID, MTU: number): Promise<number>;
export declare function bondAsync(peripheralUUID: UUID): Promise<any>;
export declare function unbondAsync(peripheralUUID: UUID): Promise<any>;
export declare function enableBluetoothAsync(isBluetoothEnabled?: boolean): Promise<void>;
export declare function getBondedPeripheralsAsync(): Promise<NativePeripheral[]>;
export declare function requestConnectionPriorityAsync(peripheralUUID: UUID, connectionPriority: Priority): Promise<void>;
export declare function observeBluetoothEnabled(callback: (updates: Central) => void): Subscription;
