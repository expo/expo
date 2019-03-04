import { Subscription } from 'expo-core';
import { Central, NativePeripheral } from './Bluetooth.types';
export declare function firePeripheralObservers(): void;
export declare function fireSingleEventHandlers(event: string, { central, peripheral, error, }: {
    central?: Central | null;
    peripheral?: NativePeripheral | null;
    error: any;
}): void;
export declare function fireMultiEventHandlers(event: string, { central, peripheral, error, }: {
    central?: Central | null;
    peripheral?: NativePeripheral | null;
    error: any;
}): void;
export declare function resetHandlersForKey(key: any): Promise<any[]>;
export declare function _resetAllHandlers(): Promise<void>;
export declare function addHandlerForKey(key: string, callback: (updates: any) => void): Subscription;
export declare function addHandlerForID(key: string, id: string, callback: (updates: any) => void): Subscription;
export declare function getHandlersForKey(key: any): any;
export declare function addListener(listener: (event: any) => void): Subscription;
export declare function removeAllListeners(): void;
