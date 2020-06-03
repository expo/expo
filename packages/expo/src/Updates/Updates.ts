import { RCTDeviceEventEmitter, UnavailabilityError } from '@unimodules/core';
import Constants from 'expo-constants';
import { EventEmitter, EventSubscription } from 'fbemitter';
import * as FileSystem from 'expo-file-system';

import ExponentUpdates from './ExponentUpdates';
import { Platform } from 'react-native';

type Manifest = typeof Constants.manifest;

type UpdateCheckResult = { isAvailable: false } | { isAvailable: true; manifest: Manifest };

type UpdateFetchResult = { isNew: false } | { isNew: true; manifest: Manifest };

type UpdateEvent =
  | { type: 'downloadStart' | 'downloadProgress' | 'noUpdateAvailable' }
  | { type: 'downloadFinished'; manifest: Manifest }
  | { type: 'error'; message: string };

type UpdateEventListener = (event: UpdateEvent) => void;

export async function reload(): Promise<void> {
  await ExponentUpdates.reload();
}

export async function reloadFromCache(): Promise<void> {
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

export async function fetchUpdateAsync({
  eventListener,
}: { eventListener?: UpdateEventListener } = {}): Promise<UpdateFetchResult> {
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

  if (!result) {
    return { isNew: false };
  }

  return {
    isNew: true,
    manifest: typeof result === 'string' ? JSON.parse(result) : result,
  };
}

export async function clearUpdateCacheExperimentalAsync(
  sdkVersion?: string
): Promise<{ success: boolean; errors: string[] }> {
  let errors: string[] = [];
  if (Platform.OS !== 'android') {
    errors.push('This method is only supported on Android.');
    return { success: false, errors };
  }

  if (Constants.manifest && FileSystem.documentDirectory) {
    let sdkBundlesPath = FileSystem.documentDirectory + sdkVersion ?? Constants.manifest.sdkVersion;
    let sdkBundleFiles = await FileSystem.readDirectoryAsync(sdkBundlesPath);

    sdkBundleFiles.forEach(async filename => {
      let fullpath = sdkBundlesPath + '/' + filename;
      // In java, we use `getPath`, which decodes, so we need to double-encode these values
      fullpath = fullpath.replace('%40', '%2540').replace('%2F', '%252F');

      let bundleUrlStringHashcode = hashCode(Constants.manifest.bundleUrl);
      let isCurrentlyRunningBundle = filename.includes(bundleUrlStringHashcode);
      if (!isCurrentlyRunningBundle) {
        try {
          await FileSystem.deleteAsync(fullpath);
        } catch (e) {
          errors.push(e);
        }
      }
    });
    if (!errors.length) {
      return { success: true, errors };
    }
  } else {
    errors.push('This method is only available in standalone apps.');
  }

  return { success: false, errors };
}

export function hashCode(string: string): string {
  let hash = 0,
    length = string.length,
    i = 0;
  if (length > 0) {
    while (i < length) {
      hash = ((hash << 5) - hash + string.charCodeAt(i++)) | 0;
    }
  }
  return hash.toString();
}

let _emitter: EventEmitter | null;

function _getEmitter(): EventEmitter {
  if (!_emitter) {
    _emitter = new EventEmitter();
    RCTDeviceEventEmitter.addListener('Exponent.nativeUpdatesEvent', _emitEvent);
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
  const emitter = _getEmitter();
  return emitter.addListener('Exponent.updatesEvent', listener);
}

export const EventType = {
  DOWNLOAD_STARTED: 'downloadStart',
  DOWNLOAD_PROGRESS: 'downloadProgress',
  DOWNLOAD_FINISHED: 'downloadFinished',
  NO_UPDATE_AVAILABLE: 'noUpdateAvailable',
  ERROR: 'error',
};
