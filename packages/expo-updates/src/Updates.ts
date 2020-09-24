import {
  RCTDeviceEventEmitter,
  CodedError,
  NativeModulesProxy,
  UnavailabilityError,
} from '@unimodules/core';
import { EventEmitter, EventSubscription } from 'fbemitter';

import ExpoUpdates from './ExpoUpdates';
import {
  Listener,
  LocalAssets,
  Manifest,
  UpdateCheckResult,
  UpdateEvent,
  UpdateFetchResult,
} from './Updates.types';

export * from './Updates.types';

export const updateId: string | null =
  ExpoUpdates.updateId && typeof ExpoUpdates.updateId === 'string'
    ? ExpoUpdates.updateId.toLowerCase()
    : null;
export const releaseChannel: string = ExpoUpdates.releaseChannel ?? 'default';
export const localAssets: LocalAssets = ExpoUpdates.localAssets ?? {};
export const isEmergencyLaunch: boolean = ExpoUpdates.isEmergencyLaunch || false;
export const isUsingEmbeddedAssets: boolean = ExpoUpdates.isUsingEmbeddedAssets || false;

let _manifest = ExpoUpdates.manifest;
if (ExpoUpdates.manifestString) {
  _manifest = JSON.parse(ExpoUpdates.manifestString);
}
export const manifest: Manifest | object = _manifest ?? {};

const isUsingDeveloperTool = !!(manifest as any).developer?.tool;
const isUsingExpoDevelopmentClient = NativeModulesProxy.ExponentConstants?.appOwnership === 'expo';
const manualUpdatesInstructions = isUsingExpoDevelopmentClient
  ? 'To test manual updates, publish your project using `expo publish` and open the published ' +
    'version in this development client.'
  : 'To test manual updates, make a release build with `npm run ios --configuration Release` or ' +
    '`npm run android --variant Release`.';

export async function reloadAsync(): Promise<void> {
  if (!ExpoUpdates.reload) {
    throw new UnavailabilityError('Updates', 'reloadAsync');
  }
  if (__DEV__ && !isUsingExpoDevelopmentClient) {
    throw new CodedError(
      'ERR_UPDATES_DISABLED',
      `You cannot use the Updates module in development mode in a production app. ${manualUpdatesInstructions}`
    );
  }
  await ExpoUpdates.reload();
}

export async function checkForUpdateAsync(): Promise<UpdateCheckResult> {
  if (!ExpoUpdates.checkForUpdateAsync) {
    throw new UnavailabilityError('Updates', 'checkForUpdateAsync');
  }
  if (__DEV__ || isUsingDeveloperTool) {
    throw new CodedError(
      'ERR_UPDATES_DISABLED',
      `You cannot check for updates in development mode. ${manualUpdatesInstructions}`
    );
  }

  const result = await ExpoUpdates.checkForUpdateAsync();
  if (result.manifestString) {
    result.manifest = JSON.parse(result.manifestString);
    delete result.manifestString;
  }

  return result;
}

export async function fetchUpdateAsync(): Promise<UpdateFetchResult> {
  if (!ExpoUpdates.fetchUpdateAsync) {
    throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
  }
  if (__DEV__ || isUsingDeveloperTool) {
    throw new CodedError(
      'ERR_UPDATES_DISABLED',
      `You cannot fetch updates in development mode. ${manualUpdatesInstructions}`
    );
  }

  const result = await ExpoUpdates.fetchUpdateAsync();
  if (result.manifestString) {
    result.manifest = JSON.parse(result.manifestString);
    delete result.manifestString;
  }

  return result;
}

export function clearUpdateCacheExperimentalAsync(_sdkVersion?: string) {
  console.warn(
    "This method is no longer necessary. `expo-updates` now automatically deletes your app's old bundle files!"
  );
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
  const emitter = _getEmitter();
  return emitter.addListener('Expo.updatesEvent', listener);
}
