import { RCTDeviceEventEmitter, UnavailabilityError } from '@unimodules/core';
import Constants from 'expo-constants';
import { EventEmitter, EventSubscription } from 'fbemitter';

import ExponentUpdates from './ExponentUpdates';
import {
  Listener,
  LocalAssets,
  Manifest,
  UpdateCheckResult,
  UpdateEvent,
  UpdateEventType,
  UpdateFetchResult,
} from './Updates.types';

export * from './Updates.types';

export const localAssets: LocalAssets = {};
export const manifest: Manifest | object = Constants.manifest ?? {};
export const updateId: string | null = manifest.hasOwnProperty('releaseId')
  ? (manifest as Manifest & { releaseId: string }).releaseId.toLowerCase()
  : null;
export const releaseChannel: string = manifest.hasOwnProperty('releaseChannel')
  ? (manifest as Manifest & { releaseChannel: string }).releaseChannel
  : 'default';
export const isEmergencyLaunch: boolean = false;
export const isUsingEmbeddedAssets: boolean = false;

export async function reloadAsync(): Promise<void> {
  if (!ExponentUpdates.reloadFromCache) {
    throw new UnavailabilityError('Updates', 'reloadAsync');
  }
  await ExponentUpdates.reloadFromCache();
}

export async function checkForUpdateAsync(): Promise<UpdateCheckResult> {
  if (!ExponentUpdates.checkForUpdateAsync) {
    throw new UnavailabilityError('Updates', 'checkForUpdateAsync');
  }
  const result = await ExponentUpdates.checkForUpdateAsync();
  if (!result) {
    return { isAvailable: false };
  }

  return {
    isAvailable: true,
    manifest: typeof result === 'string' ? JSON.parse(result) : result,
  };
}

export async function fetchUpdateAsync(): Promise<UpdateFetchResult> {
  if (!ExponentUpdates.fetchUpdateAsync) {
    throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
  }
  _isFetchingUpdate = true;
  const result = await ExponentUpdates.fetchUpdateAsync();
  setTimeout(() => {
    _isFetchingUpdate = false;
  }, 0);

  if (!result) {
    return { isNew: false };
  }

  return {
    isNew: true,
    manifest: typeof result === 'string' ? JSON.parse(result) : result,
  };
}

let _emitter: EventEmitter | null;
let _isFetchingUpdate = false;

function _getEmitter(): EventEmitter {
  if (!_emitter) {
    _emitter = new EventEmitter();
    RCTDeviceEventEmitter.addListener('Exponent.nativeUpdatesEvent', _emitEvent);
  }
  return _emitter;
}

function _emitEvent(params): void {
  // The legacy implementation emits additional events during the `fetchUpdateAsync` call. Since the
  // new implementation does not do this, we should ignore these events.
  if (_isFetchingUpdate) {
    return;
  }

  let newParams = params;
  if (typeof params === 'string') {
    newParams = JSON.parse(params);
  }
  if (newParams.manifestString) {
    newParams.manifest = JSON.parse(newParams.manifestString);
    delete newParams.manifestString;
  }

  // transform legacy event types
  if (
    newParams.type === LegacyUpdatesEventType.DOWNLOAD_STARTED ||
    newParams.type === LegacyUpdatesEventType.DOWNLOAD_PROGRESS
  ) {
    return;
  } else if (newParams.type === LegacyUpdatesEventType.DOWNLOAD_FINISHED) {
    newParams.type = UpdateEventType.UPDATE_AVAILABLE;
  }

  if (!_emitter) {
    throw new Error(`EventEmitter must be initialized to use from its listener`);
  }
  _emitter.emit('Expo.updatesEvent', newParams);
}

export function addListener(listener: Listener<UpdateEvent>): EventSubscription {
  const emitter = _getEmitter();
  return emitter.addListener('Expo.updatesEvent', listener);
}

enum LegacyUpdatesEventType {
  DOWNLOAD_STARTED = 'downloadStart',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  DOWNLOAD_FINISHED = 'downloadFinished',
  NO_UPDATE_AVAILABLE = 'noUpdateAvailable',
  ERROR = 'error',
}
