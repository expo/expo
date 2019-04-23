import { UnavailabilityError } from '@unimodules/core';
import { EventEmitter, EventSubscription } from 'fbemitter';
import DeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';

import ExponentUpdates from './ExponentUpdates';

export async function reload(): Promise<void> {
  await ExponentUpdates.reload();
}

export async function reloadFromCache(): Promise<void> {
  await ExponentUpdates.reloadFromCache();
}

export async function checkForUpdateAsync(): Promise<Object> {
  if (!ExponentUpdates.checkForUpdateAsync) {
    throw new UnavailabilityError('Updates', 'checkForUpdateAsync');
  }
  const result = await ExponentUpdates.checkForUpdateAsync();
  let returnObj: any = {
    isAvailable: !!result,
  };
  if (result) {
    returnObj.manifest = typeof result === 'string' ? JSON.parse(result) : result;
  }
  return returnObj;
}

export async function fetchUpdateAsync({ eventListener }: any = {}): Promise<Object> {
  if (!ExponentUpdates.fetchUpdateAsync) {
    throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
  }
  let subscription;
  let result;
  if (eventListener && typeof eventListener === 'function') {
    subscription = addListener(eventListener);
  }
  try {
    result = await ExponentUpdates.fetchUpdateAsync();
  } finally {
    subscription && subscription.remove();
  }
  let returnObj: any = {
    isNew: !!result,
  };
  if (result) {
    returnObj.manifest = typeof result === 'string' ? JSON.parse(result) : result;
  }
  return returnObj;
}

let _emitter: EventEmitter | null;

function _getEmitter(): EventEmitter {
  if (!_emitter) {
    _emitter = new EventEmitter();
    DeviceEventEmitter.addListener('Exponent.nativeUpdatesEvent', _emitEvent);
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
  _emitter.emit('Exponent.updatesEvent', newParams);
}

export function addListener(listener: Function): EventSubscription {
  let emitter = _getEmitter();
  return emitter.addListener('Exponent.updatesEvent', listener);
}

export const EventType = {
  DOWNLOAD_STARTED: 'downloadStart',
  DOWNLOAD_PROGRESS: 'downloadProgress',
  DOWNLOAD_FINISHED: 'downloadFinished',
  NO_UPDATE_AVAILABLE: 'noUpdateAvailable',
  ERROR: 'error',
};
