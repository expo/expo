import { Peripheral, UUID } from './Bluetooth.types';
export declare function getPeripherals(): {
    [peripheralId: string]: Peripheral;
};
export declare function getPeripheralForId(id: string): any;
export declare function clearPeripherals(): void;
export declare function removePeripheral(uuid: UUID): void;
export declare function updateStateWithPeripheral(peripheral: Peripheral): void;
export declare function updateAdvertismentDataStore(peripheralId: string, advertisementData: any): void;
