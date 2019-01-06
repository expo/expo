// @flow

import { EventEmitter } from 'expo-core';
import invariant from 'invariant';

import { UnavailabilityError } from 'expo-errors';

import ExpoBluetooth from './ExpoBluetooth';

const eventEmitter = new EventEmitter(ExpoBluetooth);

type ScanOptions = {
  options?: any,
  uuid?: string,
  serviceUUIDs?: string[],
};

function _validateUUID(uuid: string) {
  invariant(uuid && typeof uuid === 'string' && uuid !== '', 'Bluetooth: Invalid UUID provided!');
}

export const { Events } = ExpoBluetooth;

export async function startScanAsync(options: ScanOptions = {}): Promise<any> {
  if (!ExpoBluetooth.startScanAsync) {
    throw new UnavailabilityError('Bluetooth', 'startScanAsync');
  }
  return await ExpoBluetooth.startScanAsync(options);
}

export async function stopScanAsync(): Promise<any> {
  if (!ExpoBluetooth.stopScanAsync) {
    throw new UnavailabilityError('Bluetooth', 'stopScanAsync');
  }
  return await ExpoBluetooth.stopScanAsync();
}

// Peripherals

export async function connectAsync(options: ScanOptions = {}): Promise<any> {
  if (!ExpoBluetooth.connectAsync) {
    throw new UnavailabilityError('Bluetooth', 'connectAsync');
  }
  _validateUUID(options.uuid);
  return await ExpoBluetooth.connectAsync(options);
}

export async function disconnectAsync(options: ScanOptions = {}): Promise<any> {
  if (!ExpoBluetooth.disconnectAsync) {
    throw new UnavailabilityError('Bluetooth', 'disconnectAsync');
  }
  _validateUUID(options.uuid);
  return await ExpoBluetooth.disconnectAsync(options);
}

export async function discoverServicesAsync(options: ScanOptions = {}): Promise<any> {
  if (!ExpoBluetooth.discoverServicesAsync) {
    throw new UnavailabilityError('Bluetooth', 'discoverServicesAsync');
  }
  _validateUUID(options.uuid);
  return await ExpoBluetooth.discoverServicesAsync(options);
}

type WriteOptions = {
  uuid: string,
  service: string,
  characteristic: string,
  descriptor?: string,
  characteristicProperties: number,
  operation: 'read' | 'write',
  shouldMute: boolean,
  data: any,
};

// Interactions 

export async function readAsync(options: WriteOptions = {}): Promise<any> {
  return await updateAsync({ ...options, operation: 'read' });
}

export async function writeAsync(options: WriteOptions = {}): Promise<any> {
  return await updateAsync({ ...options, operation: 'write' });
}

export async function updateAsync(options: WriteOptions = {}): Promise<any> {
  if (!ExpoBluetooth.updateAsync) {
    throw new UnavailabilityError('Bluetooth', 'updateAsync');
  }
  _validateUUID(options.uuid);
  //TODO: Bacon: More validation
  return await ExpoBluetooth.updateAsync(options);
}

export async function readRSSIAsync({ uuid } = {}): Promise<any> {
  if (!ExpoBluetooth.readRSSIAsync) {
    throw new UnavailabilityError('Bluetooth', 'readRSSIAsync');
  }
  _validateUUID(uuid);
  return await ExpoBluetooth.readRSSIAsync({ uuid });
}

// Get data

export async function getPeripheralsAsync(options: ScanOptions = {}): Promise<any> {
  if (!ExpoBluetooth.getPeripheralsAsync) {
    throw new UnavailabilityError('Bluetooth', 'getPeripheralsAsync');
  }
  return await ExpoBluetooth.getPeripheralsAsync(options);
}

export async function getCentralAsync(): Promise<any> {
  if (!ExpoBluetooth.getCentralAsync) {
    throw new UnavailabilityError('Bluetooth', 'getCentralAsync');
  }
  return await ExpoBluetooth.getCentralAsync();
}

export async function isScanningAsync(): Promise<any> {
  const central = await getCentralAsync();
  return central.isScanning;
}

type Subscription = {
  remove: () => void,
};

/* EXP Listener Pattern */
export function addListener(listener: () => void): Subscription {
  const subscription = eventEmitter.addListener(ExpoBluetooth.BLUETOOTH_EVENT, listener);
  subscription.remove = () => this.removeSubscription(subscription);
  return subscription;
}

export function removeSubscription(subscription: Subscription): void {
  eventEmitter.removeSubscription(subscription);
}

export function removeAllListeners(): void {
  eventEmitter.removeAllListeners(ExpoBluetooth.BLUETOOTH_EVENT);
}
