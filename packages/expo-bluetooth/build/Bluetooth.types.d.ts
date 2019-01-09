export declare enum CentralState {
    Unknown = "unknown",
    Resetting = "resetting",
    Unsupported = "unsupported",
    Unauthorized = "unauthorized",
    PoweredOff = "poweredOff",
    PoweredOn = "poweredOn"
}
export declare enum PeripheralState {
    Disconnected = "disconnected",
    Connecting = "connecting",
    Connected = "connected",
    Disconnecting = "disconnecting",
    Unknown = "unknown"
}
export declare type Base64 = string;
export declare type UUID = string;
export declare type Identifier = string;
export declare type TransactionId = string;
export interface NodeInterface {
    id: Identifier;
    uuid: UUID;
}
export interface DescriptorInterface extends NodeInterface {
    characteristicUUID: UUID;
    value?: Base64;
}
export declare type NativeEventData = {
    transactionId?: TransactionId;
    peripheral?: PeripheralInterface | null;
    peripherals?: PeripheralInterface[];
    characteristic?: CharacteristicInterface | null;
    central?: Central | null;
    descriptor?: DescriptorInterface | null;
    service?: ServiceInterface | null;
    advertisementData?: AdvertismentDataInterface | null;
    rssi?: number;
    error?: ErrorInterface | null;
};
export interface ErrorInterface {
    message: string;
    code: string;
}
export interface CharacteristicInterface extends NodeInterface {
    serviceUUID: UUID;
    peripheralUUID: UUID;
    properties: string[];
    descriptors: DescriptorInterface[];
    value: Base64 | null;
    isNotifying: boolean;
    isReadable: boolean;
    isWritableWithResponse: boolean;
    isWritableWithoutResponse: boolean;
    isNotifiable: boolean;
    isIndicatable: boolean;
}
export interface ServiceInterface extends NodeInterface {
    peripheralUUID: UUID;
    isPrimary: boolean;
    includedServices: ServiceInterface[];
    characteristics: CharacteristicInterface[];
}
export interface AdvertismentDataInterface {
    manufacturerData: Base64 | null;
    serviceData: {
        [uuid: string]: Base64;
    } | null;
    serviceUUIDs: Array<UUID> | null;
    localName: string | null;
    txPowerLevel: number | null;
    solicitedServiceUUIDs: Array<UUID> | null;
    isConnectable: boolean | null;
    overflowServiceUUIDs: Array<UUID> | null;
}
export interface PeripheralInterface extends NodeInterface {
    advertismentData?: AdvertismentDataInterface;
    name: string | null;
    rssi: number | null;
    state: PeripheralState;
    canSendWriteWithoutResponse: boolean;
    services: ServiceInterface[];
    discoveryTimestamp?: number;
}
export declare enum TransactionType {
    get = "get",
    read = "read",
    write = "write",
    connect = "connect",
    disconnect = "disconnect",
    scan = "scan"
}
export declare type PeripheralFoundCallback = ((peripheral: PeripheralInterface) => void);
export declare type StateUpdatedCallback = (state: CentralState) => void;
export declare type ScanSettings = {
    serviceUUIDsToQuery?: UUID[];
    scanningOptions?: any;
    callback?: PeripheralFoundCallback;
};
export interface Central {
    state: CentralState;
    isScanning: boolean;
}
export declare type WriteOptions = {
    peripheralUUID: string;
    serviceUUID: string;
    characteristicUUID: string;
    descriptorUUID?: string;
    characteristicProperties: number;
    shouldMute: boolean;
    data: any;
};
