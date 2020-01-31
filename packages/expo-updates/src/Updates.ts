import { RCTDeviceEventEmitter, UnavailabilityError } from '@unimodules/core';
import Constants from 'expo-constants';
import { EventEmitter, EventSubscription } from 'fbemitter';

import ExpoUpdates from './ExpoUpdates';

export enum EventType {
  UPDATE_AVAILABLE = 'updateAvailable',
  NO_UPDATE_AVAILABLE = 'noUpdateAvailable',
  ERROR = 'error',
}

// TODO(eric): move source of truth for manifest type to this module
type Manifest = typeof Constants.manifest;

type UpdateCheckResult = { isAvailable: false } | { isAvailable: true; manifest: Manifest };

type UpdateFetchResult = { isNew: false } | { isNew: true; manifest: Manifest };

type Listener<E> = (event: E) => void;

type UpdateEvent =
  | { type: EventType.NO_UPDATE_AVAILABLE }
  | { type: EventType.UPDATE_AVAILABLE; manifest: Manifest }
  | { type: EventType.ERROR; message: string };

type LocalAssets = { [remoteUrl: string]: string };

export const localAssets: LocalAssets = ExpoUpdates.localAssets || {};
export const manifest: Manifest | object = ExpoUpdates.manifest || {};
export const isEmergencyLaunch: boolean = ExpoUpdates.isEmergencyLaunch || false;

export async function reloadAsync(): Promise<void> {
  if (!ExpoUpdates.reload) {
    throw new UnavailabilityError('Updates', 'reloadAsync');
  }
  await ExpoUpdates.reload();
}

export async function checkForUpdateAsync(): Promise<UpdateCheckResult> {
  if (!ExpoUpdates.checkForUpdateAsync) {
    throw new UnavailabilityError('Updates', 'checkForUpdateAsync');
  }

  const result = await ExpoUpdates.checkForUpdateAsync();
  if (!result) {
    return { isAvailable: false };
  }

  return {
    isAvailable: true,
    manifest: typeof result === 'string' ? JSON.parse(result) : result,
  };
}

export async function fetchUpdateAsync(): Promise<UpdateFetchResult> {
  if (!ExpoUpdates.fetchUpdateAsync) {
    throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
  }

  const result = await ExpoUpdates.fetchUpdateAsync();
  if (!result) {
    return { isNew: false };
  }

  return {
    isNew: true,
    manifest: typeof result === 'string' ? JSON.parse(result) : result,
  };
}

let _emitter: EventEmitter | null;

function _getEmitter(): EventEmitter {
  if (!_emitter) {
    _emitter = new EventEmitter();
    RCTDeviceEventEmitter.addListener('Expo.nativeUpdatesEvent', _emitEvent);
  }
  return _emitter;
}

function _emitEvent(params): void {
  let newParams = params;
  if (typeof params === 'string') {
    newParams = JSON.parse(params);
  }
  if (newParams.manifestString) {
    newParams.manifest = JSON.parse(newParams.manifestString);
    delete newParams.manifestString;
  }

  if (!_emitter) {
    throw new Error(`EventEmitter must be initialized to use from its listener`);
  }
  _emitter.emit('Expo.updatesEvent', newParams);
}

export function addListener(listener: Listener<UpdateEvent>): EventSubscription {
  let emitter = _getEmitter();
  return emitter.addListener('Expo.updatesEvent', listener);
}
