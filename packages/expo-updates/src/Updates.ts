import {
  DeviceEventEmitter,
  CodedError,
  NativeModulesProxy,
  UnavailabilityError,
} from 'expo-modules-core';
import { EventEmitter, EventSubscription } from 'fbemitter';

import ExpoUpdates from './ExpoUpdates';
import {
  LocalAssets,
  Manifest,
  UpdateCheckResult,
  UpdateEvent,
  UpdateFetchResult,
  UpdatesCheckAutomaticallyValue,
  UpdatesLogEntry,
} from './Updates.types';

export * from './Updates.types';

/**
 * The UUID that uniquely identifies the currently running update if `expo-updates` is enabled. The
 * UUID is represented in its canonical string form (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) and
 * will always use lowercase letters. In development mode, or any other environment in which
 * `expo-updates` is disabled, this value is `null`.
 */
export const updateId: string | null =
  ExpoUpdates.updateId && typeof ExpoUpdates.updateId === 'string'
    ? ExpoUpdates.updateId.toLowerCase()
    : null;

/**
 * The name of the release channel currently configured in this standalone or bare app when using
 * classic updates. When using Expo Updates, the value of this field is always `"default"`.
 */
export const releaseChannel: string = ExpoUpdates.releaseChannel ?? 'default';

/**
 * The channel name of the current build, if configured for use with EAS Update. Null otherwise.
 */
export const channel: string | null = ExpoUpdates.channel ?? null;

/**
 * The runtime version of the current build.
 */
export const runtimeVersion: string | null = ExpoUpdates.runtimeVersion ?? null;

const _checkAutomaticallyMapNativeToJS = {
  ALWAYS: 'ON_LOAD',
  ERROR_RECOVERY_ONLY: 'ON_ERROR_RECOVERY',
  NEVER: 'NEVER',
  WIFI_ONLY: 'WIFI_ONLY',
};

/**
 * Determines if and when expo-updates checks for and downloads updates automatically on startup.
 */
export const checkAutomatically: UpdatesCheckAutomaticallyValue | null =
  _checkAutomaticallyMapNativeToJS[ExpoUpdates.checkAutomatically] ?? null;

// @docsMissing
/**
 * @hidden
 */
export const localAssets: LocalAssets = ExpoUpdates.localAssets ?? {};

/**
 * `expo-updates` does its very best to always launch monotonically newer versions of your app so
 * you don't need to worry about backwards compatibility when you put out an update. In very rare
 * cases, it's possible that `expo-updates` may need to fall back to the update that's embedded in
 * the app binary, even after newer updates have been downloaded and run (an "emergency launch").
 * This boolean will be `true` if the app is launching under this fallback mechanism and `false`
 * otherwise. If you are concerned about backwards compatibility of future updates to your app, you
 * can use this constant to provide special behavior for this rare case.
 */
export const isEmergencyLaunch: boolean = ExpoUpdates.isEmergencyLaunch || false;

/**
 * This will be true if the currently running update is the one embedded in the build,
 * and not one downloaded from the updates server.
 */
export const isEmbeddedLaunch: boolean = ExpoUpdates.isEmbeddedLaunch || false;

// @docsMissing
/**
 * @hidden
 */
export const isUsingEmbeddedAssets: boolean = ExpoUpdates.isUsingEmbeddedAssets || false;

/**
 * If `expo-updates` is enabled, this is the
 * [manifest](/versions/latest/sdk/constants/#manifest) (or
 * [classic manifest](/versions/latest/sdk/constants/#appmanifest))
 * object for the update that's currently running.
 *
 * In development mode, or any other environment in which `expo-updates` is disabled, this object is
 * empty.
 */
export const manifest: Partial<Manifest> =
  (ExpoUpdates.manifestString ? JSON.parse(ExpoUpdates.manifestString) : ExpoUpdates.manifest) ??
  {};

/**
 * If `expo-updates` is enabled, this is a `Date` object representing the creation time of the update that's currently running (whether it was embedded or downloaded at runtime).
 *
 * In development mode, or any other environment in which `expo-updates` is disabled, this value is
 * null.
 */
export const createdAt: Date | null = ExpoUpdates.commitTime
  ? new Date(ExpoUpdates.commitTime)
  : null;

const isUsingDeveloperTool = !!(manifest as any).developer?.tool;
const isUsingExpoDevelopmentClient = NativeModulesProxy.ExponentConstants?.appOwnership === 'expo';
const manualUpdatesInstructions = isUsingExpoDevelopmentClient
  ? 'To test manual updates, publish your project using `expo publish` and open the published ' +
    'version in this development client.'
  : 'To test manual updates, make a release build with `npm run ios --configuration Release` or ' +
    '`npm run android --variant Release`.';

/**
 * Instructs the app to reload using the most recently downloaded version. This is useful for
 * triggering a newly downloaded update to launch without the user needing to manually restart the
 * app.
 *
 * It is not recommended to place any meaningful logic after a call to `await
 * Updates.reloadAsync()`. This is because the promise is resolved after verifying that the app can
 * be reloaded, and immediately before posting an asynchronous task to the main thread to actually
 * reload the app. It is unsafe to make any assumptions about whether any more JS code will be
 * executed after the `Updates.reloadAsync` method call resolves, since that depends on the OS and
 * the state of the native module and main threads.
 *
 * This method cannot be used in development mode, and the returned promise will be rejected if you
 * try to do so.
 *
 * @return A promise that fulfills right before the reload instruction is sent to the JS runtime, or
 * rejects if it cannot find a reference to the JS runtime. If the promise is rejected in production
 * mode, it most likely means you have installed the module incorrectly. Double check you've
 * followed the installation instructions. In particular, on iOS ensure that you set the `bridge`
 * property on `EXUpdatesAppController` with a pointer to the `RCTBridge` you want to reload, and on
 * Android ensure you either call `UpdatesController.initialize` with the instance of
 * `ReactApplication` you want to reload, or call `UpdatesController.setReactNativeHost` with the
 * proper instance of `ReactNativeHost`.
 */
export async function reloadAsync(): Promise<void> {
  if (!ExpoUpdates.reload) {
    throw new UnavailabilityError('Updates', 'reloadAsync');
  }
  if (!ExpoUpdates?.nativeDebug && __DEV__ && !isUsingExpoDevelopmentClient) {
    throw new CodedError(
      'ERR_UPDATES_DISABLED',
      `You cannot use the Updates module in development mode in a production app. ${manualUpdatesInstructions}`
    );
  }
  await ExpoUpdates.reload();
}

/**
 * Checks the server to see if a newly deployed update to your project is available. Does not
 * actually download the update. This method cannot be used in development mode, and the returned
 * promise will be rejected if you try to do so.
 *
 * Checking for an update uses a device's bandwidth and battery life like any network call.
 * Additionally, updates served by Expo may be rate limited. A good rule of thumb to check for
 * updates judiciously is to check when the user launches or foregrounds the app. Avoid polling for
 * updates in a frequent loop.
 *
 * @return A promise that fulfills with an [`UpdateCheckResult`](#updatecheckresult) object.
 *
 * The promise rejects if the app is in development mode, or if there is an unexpected error or
 * timeout communicating with the server.
 */
export async function checkForUpdateAsync(): Promise<UpdateCheckResult> {
  if (!ExpoUpdates.checkForUpdateAsync) {
    throw new UnavailabilityError('Updates', 'checkForUpdateAsync');
  }
  if (!ExpoUpdates?.nativeDebug && (__DEV__ || isUsingDeveloperTool)) {
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

/**
 * Retrieves the current extra params.
 */
export async function getExtraParamsAsync(): Promise<{ [key: string]: string }> {
  if (!ExpoUpdates.getExtraParamsAsync) {
    throw new UnavailabilityError('Updates', 'getExtraParamsAsync');
  }

  return await ExpoUpdates.getExtraParamsAsync();
}

/**
 * Sets an extra param if value is non-null, otherwise unsets the param.
 * Extra params are sent in a header of update requests.
 * The update server may use these params when evaluating logic to determine which update to serve.
 * EAS Update merges these params into the fields used to evaluate channel–branch mapping logic.
 *
 * @example An app may want to add a feature where users can opt-in to beta updates. In this instance,
 * extra params could be set to `{userType: 'beta'}`, and then the server can use this information
 * when deciding which update to serve. If using EAS Update, the channel-branch mapping can be set to
 * discriminate branches based on the `userType`.
 */
export async function setExtraParamAsync(
  key: string,
  value: string | null | undefined
): Promise<void> {
  if (!ExpoUpdates.setExtraParamAsync) {
    throw new UnavailabilityError('Updates', 'setExtraParamAsync');
  }

  return await ExpoUpdates.setExtraParamAsync(key, value ?? null);
}

/**
 * Retrieves the most recent expo-updates log entries.
 *
 * @param maxAge Sets the max age of retrieved log entries in milliseconds. Default to 3600000 ms (1 hour).
 *
 * @return A promise that fulfills with an array of [`UpdatesLogEntry`](#updateslogentry) objects;
 *
 * The promise rejects if there is an unexpected error in retrieving the logs.
 */
export async function readLogEntriesAsync(maxAge: number = 3600000): Promise<UpdatesLogEntry[]> {
  if (!ExpoUpdates.readLogEntriesAsync) {
    throw new UnavailabilityError('Updates', 'readLogEntriesAsync');
  }
  return await ExpoUpdates.readLogEntriesAsync(maxAge);
}

/**
 * Clears existing expo-updates log entries.
 *
 * > For now, this operation does nothing on the client.  Once log persistence has been
 * > implemented, this operation will actually remove existing logs.
 *
 * @return A promise that fulfills if the clear operation was successful.
 *
 * The promise rejects if there is an unexpected error in clearing the logs.
 *
 */
export async function clearLogEntriesAsync(): Promise<void> {
  if (!ExpoUpdates.clearLogEntriesAsync) {
    throw new UnavailabilityError('Updates', 'clearLogEntriesAsync');
  }
  await ExpoUpdates.clearLogEntriesAsync();
}

/**
 * Downloads the most recently deployed update to your project from server to the device's local
 * storage. This method cannot be used in development mode, and the returned promise will be
 * rejected if you try to do so.
 *
 * @return A promise that fulfills with an [`UpdateFetchResult`](#updatefetchresult) object.
 *
 * The promise rejects if the app is in development mode, or if there is an unexpected error or
 * timeout communicating with the server.
 */
export async function fetchUpdateAsync(): Promise<UpdateFetchResult> {
  if (!ExpoUpdates.fetchUpdateAsync) {
    throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
  }
  if (!ExpoUpdates?.nativeDebug && (__DEV__ || isUsingDeveloperTool)) {
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

/**
 * @hidden
 */
export function clearUpdateCacheExperimentalAsync(_sdkVersion?: string) {
  console.warn(
    "This method is no longer necessary. `expo-updates` now automatically deletes your app's old bundle files!"
  );
}

let _emitter: EventEmitter | null;

function _getEmitter(): EventEmitter {
  if (!_emitter) {
    _emitter = new EventEmitter();
    DeviceEventEmitter.addListener('Expo.nativeUpdatesEvent', _emitEvent);
  }
  return _emitter;
}

function _emitEvent(params): void {
  let newParams = { ...params };
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

/**
 * Adds a callback to be invoked when updates-related events occur (such as upon the initial app
 * load) due to auto-update settings chosen at build-time. See also the
 * [`useUpdateEvents`](#useupdateeventslistener) React hook.
 *
 * @param listener A function that will be invoked with an [`UpdateEvent`](#updateevent) instance
 * and should not return any value.
 * @return An `EventSubscription` object on which you can call `remove()` to unsubscribe the
 * listener.
 */
export function addListener(listener: (event: UpdateEvent) => void): EventSubscription {
  const emitter = _getEmitter();
  return emitter.addListener('Expo.updatesEvent', listener);
}
