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

/* Types */
export type Base64 = string;
export type UUID = string;
export type Identifier = string;
export type TransactionId = string;

export interface NodeInterface {
  id: Identifier;
  uuid: UUID;
  //TODO:Bacon: Maybe add a type like peripheral, service, characteristc, descriptor
}

export interface DescriptorInterface extends NodeInterface {
  characteristicUUID: UUID;
  value?: Base64;
}

export type NativeEventData = {
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
  domain?: string | null;
  reason?: string | null;
  suggestion?: string | null;
  underlayingError?: string | null;
}

export interface CharacteristicInterface extends NodeInterface {
  serviceUUID: UUID;
  peripheralUUID: UUID;
  properties: string[]; // TODO: Bacon: more specific
  descriptors: DescriptorInterface[];
  value: Base64 | null;
  isNotifying: boolean;

  //TODO: Bacon: Add
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
  serviceData: { [uuid: string]: Base64 } | null;
  serviceUUIDs: Array<UUID> | null;
  localName: string | null;
  txPowerLevel: number | null;
  solicitedServiceUUIDs: Array<UUID> | null;
  isConnectable: boolean | null;
  overflowServiceUUIDs: Array<UUID> | null;
}

export interface PeripheralInterface extends NodeInterface {
  advertisementData?: AdvertismentDataInterface;
  name: string | null;
  rssi: number | null;
  state: PeripheralState;
  canSendWriteWithoutResponse: boolean;
  services: ServiceInterface[];
  // Android
  // mtu: number;
  // JS
  discoveryTimestamp?: number;
}

export enum TransactionType {
  get = 'get',
  rssi = 'rssi',
  connect = 'connect',
  disconnect = 'disconnect',
  scan = 'scan',
}

export type PeripheralFoundCallback = ((peripheral: PeripheralInterface) => void);

export type StateUpdatedCallback = (state: CentralState) => void;

export type ScanSettings = {
  serviceUUIDsToQuery?: UUID[];
  scanningOptions?: any; //TODO: Bacon: This is where the iOS multi-scan value would be defined.
  callback?: PeripheralFoundCallback;
};

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
