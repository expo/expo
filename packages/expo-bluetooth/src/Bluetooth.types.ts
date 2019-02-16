export enum Priority {
  High = 'high',
  LowPower = 'lowPower',
  Balanced = 'balanced',
}

export enum CentralState {
  Unknown = 'unknown',
  Resetting = 'resetting',
  Unsupported = 'unsupported',
  Unauthorized = 'unauthorized',
  PoweredOff = 'poweredOff',
  PoweredOn = 'poweredOn',
}

export enum AndroidCentralState {
  poweringOff = 'poweringOff',
  poweredOff = 'poweredOff',
  poweringOn = 'poweringOn',
  poweredOn = 'poweredOn',
  unknown = 'unknown',
}

export enum PeripheralState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnecting = 'disconnecting',
  Unknown = 'unknown',
}

export enum AndroidAdapterScanMode {
  none = 'none',
  connectable = 'connectable',
  discoverable = 'discoverable',
}

export enum AndroidScanMode {
  lowLatency = 'lowLatency',
  lowPower = 'lowPower',
  balanced = 'balanced',
  opportunistic = 'opportunistic',
}

export enum TransactionType {
  get = 'get',
  rssi = 'rssi',
  connect = 'connect',
  disconnect = 'disconnect',
  scan = 'scan',
}

export enum CharacteristicProperty {
  /* Permits broadcasts of the characteristic value using a characteristic configuration descriptor.
   * Not allowed for local characteristics.
   */
  Broadcast = 'broadcast',
  /* Permits reads of the characteristic value. */
  Read = 'read',
  /* Permits writes of the characteristic value, without a response. */
  WriteWithoutResponse = 'writeWithoutResponse',
  /* Permits writes of the characteristic value. */
  Write = 'write',
  /* Permits notifications of the characteristic value, without a response. */
  Notify = 'notify',
  /* Permits indications of the characteristic value. */
  Indicate = 'indicate',
  /* Permits signed writes of the characteristic value */
  AutheticateSignedWrites = 'autheticateSignedWrites',
  /* If set, additional characteristic properties are defined in the characteristic extended properties descriptor.
   * Not allowed for local characteristics.
   */
  ExtendedProperties = 'extendedProperties',
  /* If set, only trusted devices can enable notifications of the characteristic value. */
  NotifyEncryptionRequired = 'notifyEncryptionRequired',
  /* If set, only trusted devices can enable indications of the characteristic value. */
  IndicateEncryptionRequired = 'indicateEncryptionRequired',
}

/* Read, write, and encryption permissions for an ATT attribute. Can be combined. */
export enum Permissions {
  /* Read-only. */
  Readable = 'Readable',
  /* Write-only. */
  Writeable = 'Writeable',
  /* Readable by trusted devices. */
  ReadEncryptionRequired = 'ReadEncryptionRequired',
  /* Writeable by trusted devices. */
  WriteEncryptionRequired = 'WriteEncryptionRequired',
}

/* Types */
export type Base64 = string;
export type UUID = string;
export type Identifier = string;
export type TransactionId = string;

export interface NativeBluetoothElement {
  id: Identifier;
  uuid: UUID;
  //TODO:Bacon: Maybe add a type like peripheral, service, characteristc, descriptor
}

export interface NativeDescriptor extends NativeBluetoothElement {
  characteristicUUID: UUID;
  value?: Base64;
}

export type NativeEventData = {
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
  properties: string[]; // TODO: Bacon: more specific
  descriptors: NativeDescriptor[];
  value: Base64 | null;
  isNotifying: boolean;

  //TODO: Bacon: Add
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
  serviceData: { [uuid: string]: Base64 } | null;
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
  // mtu: number;
  // JS
  discoveryTimestamp?: number;
}

export type PeripheralFoundCallback = (peripheral: NativePeripheral) => void;

export type StateUpdatedCallback = (state: CentralState) => void;

export type ScanSettings = {
  serviceUUIDsToQuery?: UUID[];
  scanningOptions?: any; //TODO: Bacon: This is where the iOS multi-scan value would be defined.
  callback?: PeripheralFoundCallback;
};

export enum BondState {
  Bonded = 'bonded',
  Bonding = 'bonding',
  Unknown = 'unknown',
  None = 'none',
}
export interface Central {
  state: CentralState;
  isScanning: boolean;
}

export type UpdateDescriptorOptions = {
  descriptorUUID?: UUID;
};

export type UpdateOptions = {
  peripheralUUID: UUID;
  serviceUUID: UUID;
  characteristicUUID: UUID;
};

export type UpdateCharacteristicOptions = UpdateOptions & {
  isEnabled?: boolean;
};

export type ReadCharacteristicOptions = UpdateCharacteristicOptions;

export type WriteCharacteristicOptions = UpdateCharacteristicOptions & {
  data: Base64;
};

// export type TransactionHandler = { callbacks: Array<Function | Promise<any>> } | Promise<any>;
type Prom = {
  resolve: Function;
  reject: Function;
};
export type TransactionHandler = any; // { callbacks: Array<Function | Prom> } | Prom;
