export declare enum Priority {
    High = "high",
    LowPower = "lowPower",
    Balanced = "balanced"
}
export declare enum CentralState {
    Unknown = "unknown",
    Resetting = "resetting",
    Unsupported = "unsupported",
    Unauthorized = "unauthorized",
    PoweredOff = "poweredOff",
    PoweredOn = "poweredOn"
}
export declare enum AndroidCentralState {
    poweringOff = "poweringOff",
    poweredOff = "poweredOff",
    poweringOn = "poweringOn",
    poweredOn = "poweredOn",
    unknown = "unknown"
}
export declare enum PeripheralState {
    Disconnected = "disconnected",
    Connecting = "connecting",
    Connected = "connected",
    Disconnecting = "disconnecting",
    Unknown = "unknown"
}
export declare enum AndroidAdapterScanMode {
    none = "none",
    connectable = "connectable",
    discoverable = "discoverable"
}
export declare enum AndroidScanCallbackType {
    /**
     * Trigger a callback for every Bluetooth advertisement found that matches the filter criteria.
     * If no filter is active, all advertisement packets are reported.
     */
    allMatches = "allMatches",
    /**
     * A result callback is only triggered for the first advertisement packet received that matches
     * the filter criteria.
     */
    firstMatch = "firstMatch",
    /**
     * Receive a callback when advertisements are no longer received from a device that has been
     * previously reported by a first match callback.
     */
    matchLost = "MATCH_LOST"
}
export declare enum AndroidScanMode {
    lowLatency = "lowLatency",
    lowPower = "lowPower",
    balanced = "balanced",
    opportunistic = "opportunistic"
}
/** Android M 23+ */
export declare enum AndroidMatchMode {
    aggresive = "aggresive",
    sticky = "sticky"
}
/** Android M 23+ */
export declare enum AndroidNumberOfMatches {
    max = "max",
    one = "one",
    few = "few"
}
export declare enum TransactionType {
    get = "get",
    rssi = "rssi",
    connect = "connect",
    disconnect = "disconnect",
    scan = "scan"
}
export declare enum CharacteristicProperty {
    Broadcast = "broadcast",
    Read = "read",
    WriteWithoutResponse = "writeWithoutResponse",
    Write = "write",
    Notify = "notify",
    Indicate = "indicate",
    AutheticateSignedWrites = "autheticateSignedWrites",
    ExtendedProperties = "extendedProperties",
    NotifyEncryptionRequired = "notifyEncryptionRequired",
    IndicateEncryptionRequired = "indicateEncryptionRequired"
}
export declare enum Permissions {
    Readable = "Readable",
    Writeable = "Writeable",
    ReadEncryptionRequired = "ReadEncryptionRequired",
    WriteEncryptionRequired = "WriteEncryptionRequired"
}
export declare type Base64 = string;
export declare type UUID = string;
export declare type Identifier = string;
export declare type TransactionId = string;
export interface NativeBluetoothElement {
    id: Identifier;
    uuid: UUID;
}
export interface NativeDescriptor extends NativeBluetoothElement {
    characteristicUUID: UUID;
    value?: Base64;
}
export declare type NativeEventData = {
    transactionId?: TransactionId;
    peripheral?: NativePeripheral | null;
    peripherals?: NativePeripheral[];
    characteristic?: NativeCharacteristic | null;
    central?: Central | null;
    descriptor?: NativeDescriptor | null;
    service?: NativeService | null;
    advertisementData?: NativeAdvertismentData | null;
    RSSI?: number;
    error?: NativeError | null;
};
export interface NativeError {
    message: string;
    code: string;
    stack?: string;
}
export interface NativeCharacteristic extends NativeBluetoothElement {
    serviceUUID: UUID;
    peripheralUUID: UUID;
    properties: string[];
    descriptors: NativeDescriptor[];
    value: Base64 | null;
    isNotifying: boolean;
    isReadable: boolean;
    isWritableWithResponse: boolean;
    isWritableWithoutResponse: boolean;
    isNotifiable: boolean;
    isIndicatable: boolean;
}
export interface NativeService extends NativeBluetoothElement {
    peripheralUUID: UUID;
    isPrimary: boolean;
    includedServices: NativeService[];
    characteristics: NativeCharacteristic[];
}
export interface NativeAdvertismentData {
    manufacturerData: Base64 | null;
    serviceData: {
        [uuid: string]: Base64;
    } | null;
    serviceUUIDs: UUID[] | null;
    localName: string | null;
    txPowerLevel: number | null;
    solicitedServiceUUIDs: UUID[] | null;
    isConnectable: boolean | null;
    overflowServiceUUIDs: UUID[] | null;
}
export interface NativePeripheral extends NativeBluetoothElement {
    advertisementData?: NativeAdvertismentData;
    name: string | null;
    RSSI: number | null;
    state: PeripheralState;
    services: NativeService[];
    includedServices: NativeService[];
    /**
     * **ios**
     */
    canSendWriteWithoutResponse?: boolean;
    /**
     * **Android**
     */
    bondState?: BondState;
    discoveryTimestamp?: number;
}
export declare type PeripheralFoundCallback = (peripheral: NativePeripheral) => void;
export declare type StateUpdatedCallback = (state: CentralState) => void;
export declare type ScanSettings = {
    serviceUUIDsToQuery?: UUID[];
    scanningOptions?: any;
    callback?: PeripheralFoundCallback;
};
export declare enum BondState {
    Bonded = "bonded",
    Bonding = "bonding",
    Unknown = "unknown",
    None = "none"
}
export interface Central {
    state: CentralState;
    isScanning: boolean;
}
export declare type UpdateDescriptorOptions = {
    descriptorUUID?: UUID;
};
export declare type UpdateOptions = {
    peripheralUUID: UUID;
    serviceUUID: UUID;
    characteristicUUID: UUID;
};
export declare type UpdateCharacteristicOptions = UpdateOptions & {
    isEnabled?: boolean;
};
export declare type ReadCharacteristicOptions = UpdateCharacteristicOptions;
export declare type WriteCharacteristicOptions = UpdateCharacteristicOptions & {
    data: Base64;
};
export declare type TransactionHandler = any;
export declare type ScanOptions = {
    serviceUUIDsToQuery?: UUID[];
    androidCallbackType?: AndroidScanCallbackType;
    androidScanMode?: AndroidScanMode;
    /** M (23+) */
    androidMatchMode?: AndroidMatchMode;
    /**
     * M (23+)
     * Match as many advertisement per filter as hw could allow
     * dependes on current capability and availability of the resources in hw.
     */
    androidNumberOfMatches?: AndroidNumberOfMatches;
    /** Oreo (26+) */
    androidOnlyConnectable?: boolean;
    [key: string]: any;
};
export declare type CancelScanningCallback = () => void;
