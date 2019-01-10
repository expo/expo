export enum CentralState {
  Unknown = 'unknown',
  Resetting = 'resetting',
  Unsupported = 'unsupported',
  Unauthorized = 'unauthorized',
  PoweredOff = 'poweredOff',
  PoweredOn = 'poweredOn',
}
export enum PeripheralState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnecting = 'disconnecting',
  Unknown = 'unknown',
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
  advertismentData?: AdvertismentDataInterface;
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
  read = 'read',
  write = 'write',
  connect = 'connect',
  disconnect = 'disconnect',
  scan = 'scan',
}

export type PeripheralFoundCallback = ((peripheral: PeripheralInterface) => void);

export type StateUpdatedCallback = (state: CentralState) => void;

export type ScanSettings = {
  serviceUUIDsToQuery?: UUID[];
  scanningOptions?: any; //TODO: Bacon:
  callback?: PeripheralFoundCallback;
};

export interface Central {
  state: CentralState;
  isScanning: boolean;
}

export type WriteOptions = {
  peripheralUUID: UUID;
  serviceUUID: UUID;
  characteristicUUID: UUID;
  descriptorUUID?: UUID;
  characteristicProperties: CharacteristicProperty;
  shouldMute?: boolean;
  data?: Base64;
};

export enum CharacteristicProperty {
  Broadcast = 'broadcast',
  WriteWithoutResponse = 'writeWithoutResponse',
  Write = 'write',
  Notify = 'notify',
  Indicate = 'indicate',
  AutheticateSignedWrites = 'autheticateSignedWrites',
  ExtendedProperties = 'extendedProperties',
  NotifyEncryptionRequired = 'notifyEncryptionRequired',
  IndicateEncryptionRequired = 'indicateEncryptionRequired',
}
