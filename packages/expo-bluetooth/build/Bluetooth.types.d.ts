export declare type RSSI = number;
export declare type MTU = number;
export declare type Base64 = string;
export declare type UUID = string;
export declare type Identifier = string;
export declare type OperationId = string;
export declare enum BondState {
    Bonded = "bonded",
    Bonding = "bonding",
    Unknown = "unknown",
    None = "none"
}
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
export declare enum DeviceType {
    Central = "central",
    Peripheral = "peripheral",
    Descriptor = "descriptor",
    Service = "service",
    Characteristic = "characteristic",
    Peer = "peer",
    L2CAPChannel = "L2CAPChannel"
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
    matchLost = "matchLost"
}
export declare enum AndroidScanMode {
    lowLatency = "lowLatency",
    lowPower = "lowPower",
    balanced = "balanced",
    opportunistic = "opportunistic"
}
/** Android M 23+ */
export declare enum AndroidMatchMode {
    Aggresive = "aggresive",
    Sticky = "sticky"
}
/**
 * **Android** _Oreo (26+)_
 */
export declare enum AndroidPhyMode {
    LE1M = "LE1M",
    LE2M = "LE2M",
    Coded = "coded",
    AllSupported = "allSupported"
}
/**
 * **Android** _Marshmellow (23+)_
 */
export declare enum AndroidNumberOfMatches {
    max = "max",
    one = "one",
    few = "few"
}
export declare enum OperationType {
    get = "get",
    rssi = "rssi",
    connect = "connect",
    disconnect = "disconnect",
    scan = "scan"
}
export declare enum CharacteristicProperty {
    /**
     * Permits broadcasts of the characteristic value using a characteristic configuration descriptor.
     * Not allowed for local characteristics.
     */
    Broadcast = "broadcast",
    /**
     * Permits reads of the characteristic value.
     */
    Read = "read",
    /**
     * Permits writes of the characteristic value, without a response.
     */
    WriteWithoutResponse = "writeWithoutResponse",
    /**
     * Permits writes of the characteristic value.
     */
    Write = "write",
    /**
     * Permits notifications of the characteristic value, without a response.
     */
    Notify = "notify",
    /**
     * Permits indications of the characteristic value.
     */
    Indicate = "indicate",
    /**
     * Permits signed writes of the characteristic value
     */
    AuthenticateSignedWrites = "authenticateSignedWrites",
    /**
     * If set, additional characteristic properties are defined in the characteristic extended properties descriptor.
     * Not allowed for local characteristics.
     */
    ExtendedProperties = "extendedProperties",
    /**
     * If set, only trusted devices can enable notifications of the characteristic value.
     */
    NotifyEncryptionRequired = "notifyEncryptionRequired",
    /**
     * If set, only trusted devices can enable indications of the characteristic value.
     */
    IndicateEncryptionRequired = "indicateEncryptionRequired"
}
/**
 * Read, write, and encryption permissions for an **ATT** attribute.
 * This value can be combined.
 */
export declare enum Permissions {
    /**
     * Read-only.
     */
    Readable = "Readable",
    /**
     * Write-only.
     */
    Writeable = "Writeable",
    /**
     * Readable by trusted devices.
     */
    ReadEncryptionRequired = "ReadEncryptionRequired",
    /**
     * Writeable by trusted devices.
     */
    WriteEncryptionRequired = "WriteEncryptionRequired"
}
export interface BluetoothElement {
    id: Identifier;
    uuid: UUID;
}
export interface Descriptor extends BluetoothElement {
    characteristicUUID: UUID;
    value?: Base64;
}
export declare type EventData = {
    operationId?: OperationId;
    peripheral?: Peripheral | null;
    peripherals?: Peripheral[];
    characteristic?: Characteristic | null;
    central?: Central | null;
    descriptor?: Descriptor | null;
    service?: Service | null;
    advertisementData?: AdvertisementData | null;
    RSSI?: RSSI;
    error?: NativeError | null;
};
export interface NativeError {
    message: string;
    code: string;
    stack?: string;
}
export interface Characteristic extends BluetoothElement {
    serviceUUID: UUID;
    peripheralUUID: UUID;
    properties: string[];
    descriptors: Descriptor[];
    value: Base64 | null;
    isNotifying: boolean;
}
export interface Service extends BluetoothElement {
    peripheralUUID: UUID;
    isPrimary: boolean;
    includedServices: Service[];
    characteristics: Characteristic[];
}
export interface AdvertisementData {
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
export interface Peripheral extends BluetoothElement {
    advertisementData?: AdvertisementData;
    name: string | null;
    RSSI: RSSI | null;
    state: PeripheralState;
    services: Service[];
    includedServices: Service[];
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
export declare type StateUpdatedCallback = (state: CentralState) => void;
export interface Central {
    state: CentralState;
    isScanning: boolean;
}
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
export declare type OperationHandler = any;
export declare type ScanOptions = {
    serviceUUIDsToQuery?: UUID[];
    /**
     * Use this for continuously updating peripheral data like the RSSI.
     *  **iOS Only**
     * `CBCentralManagerScanOptionAllowDuplicatesKey`
     *
     * Indicating that the scan should run without duplicate filtering.
     * By default, multiple discoveries of the same peripheral are coalesced
     * into a single discovery event.
     *
     * Specifying this option will cause a discovery event to be generated
     * every time the peripheral is seen, which may be many times per second.
     * This can be useful in specific situations, such as making a connection based on
     * a peripheral's RSSI, but may have an adverse affect on battery-life and application performance.
     */
    iosAllowDuplicates?: boolean;
    /**
     * **iOS Only**
     * `CBCentralManagerScanOptionSolicitedServiceUUIDsKey`
     * An array of UUIDs respresenting service UUIDs.
     * This causes the scan to also look for peripherals soliciting any of the services contained in the list.
     */
    iosSolicitedServiceUUIDs?: UUID[];
    /**
     * **Android Only**
     * What kind of scan will invoke a callback
     */
    androidCallbackType?: AndroidScanCallbackType;
    /**
     * **Android Only**
     * Sets the `ScanSettings.Builder.scanMode` property
     */
    androidScanMode?: AndroidScanMode;
    /**
     * **Android Only** _Marshmallow (23+)_
     */
    androidMatchMode?: AndroidMatchMode;
    /**
     * **Android Only** _Marshmallow (23+)_
     * Match as many advertisement per filter as hw could allow
     * dependes on current capability and availability of the resources in hw.
     */
    androidNumberOfMatches?: AndroidNumberOfMatches;
    /**
     * **Android Only** _Oreo (26+)_
     */
    androidOnlyConnectable?: boolean;
    /**
     * **Android Only** _Oreo (26+)_
     * This value will only be used if `androidPhy` is undefined.
     */
    androidUseLegacy?: boolean;
    /**
     * **Android Only** _Oreo (26+)_
     * When defined, `androidUseLegacy` is automatically set to `false`.
     */
    androidPhy?: AndroidPhyMode;
};
export declare type CentralManagerOptions = {
    /**
     * **iOS Only**
     * `CBCentralManagerOptionShowPowerAlertKey`
     * If this is toggled on, and the Bluetooth manager is powered off, then the system will display a warning dialog to the user.
     */
    showPowerAlert?: boolean;
    /**
     * **UNSUPPORTED**
     * `CBCentralManagerOptionRestoreIdentifierKey`
     * A `string` containing a unique identifier (UID) for the `CBCentralManager` that is being instantiated.
     * This UID is used by the system to identify a specific `CBCentralManager` instance for restoration and,
     * therefore, must remain the same for subsequent application executions
     * in order for the manager to be restored.
     */
    restorationId?: string;
};
export declare type CancelScanningCallback = () => void;
export declare type PeripheralConnectionOption = {
    /**
     * **Android Only**
     * Should be used for _reconnecting_ to devices that have already
     * been connected (then disconnected) **without** `shouldAutoConnect` enabled.
     */
    shouldAutoConnect?: boolean;
    /**
     * **iOS Only**
     * `CBConnectPeripheralOptionNotifyOnConnectionKey`
     * A Boolean value that specifies whether the system should display an alert for a given peripheral if the app is suspended when a successful connection is made.
     * The value for this key is an NSNumber object. This key is useful for apps that have not specified the bluetooth-central background mode and cannot display their own alert. If more than one app has requested notification for a given peripheral, the one that was most recently in the foreground receives the alert. If the key is not specified, the default value is false.
     */
    shouldAlertConnection?: boolean;
    /**
     * **iOS Only**
     * `CBConnectPeripheralOptionNotifyOnDisconnectionKey`
     * A Boolean value that specifies whether the system should display a disconnection alert for a given peripheral if the app is suspended at the time of the disconnection.
     * The value for this key is an NSNumber object. This key is useful for apps that have not specified the bluetooth-central background mode and cannot display their own alert. If more than one app has requested notification for a given peripheral, the one that was most recently in the foreground receives the alert. If the key is not specified, the default value is false.
     */
    shouldAlertDisconnection?: boolean;
    /**
     * **iOS Only**
     * `CBConnectPeripheralOptionNotifyOnNotificationKey`
     * A Boolean value that specifies whether the system should display an alert for all notifications received from a given peripheral if the app is suspended at the time.
     * The value for this key is an NSNumber object. This key is useful for apps that have not specified the bluetooth-central background mode and cannot display their own alert. If more than one app has requested notification for a given peripheral, the one that was most recently in the foreground receives the alert. If the key is not specified, the default value is false.
     */
    shouldAlertNotification?: boolean;
    /**
     * **iOS Only**
     * `CBConnectPeripheralOptionStartDelayKey`
     * Indicates the number of seconds for the system to wait before starting a connection.
     */
    startDelay?: number;
};
export declare type ConnectionOptions = {
    /**
     * The duration in milliseconds to wait before automatically quiting the connection.
     * If undefined then the client will rely on the native API to quit connecting.
     */
    timeout?: number;
    /**
     * A callback that is invoked when the peripheral has disconnected.
     * This is useful for when a peripheral disconnects itself unexpectedly.
     */
    onDisconnect?: (...args: any[]) => any;
};
