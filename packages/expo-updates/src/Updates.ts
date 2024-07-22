import { CodedError } from 'expo-modules-core';

import ExpoUpdates from './ExpoUpdates';
import {
  LocalAssets,
  Manifest,
  UpdateCheckResult,
  UpdateFetchResult,
  UpdatesCheckAutomaticallyValue,
  UpdatesLogEntry,
  UpdatesNativeStateMachineContext,
} from './Updates.types';

/**
 * Whether `expo-updates` is enabled. This may be false in a variety of cases including:
 * - enabled set to false in configuration
 * - missing or invalid URL in configuration
 * - missing runtime version or SDK version in configuration
 * - error accessing storage on device during initialization
 *
 * When false, the embedded update is loaded.
 */
export const isEnabled: boolean = !!ExpoUpdates.isEnabled;

/**
 * The UUID that uniquely identifies the currently running update. The
 * UUID is represented in its canonical string form and will always use lowercase letters.
 * This value is `null` when running in a local development environment or any other environment where `expo-updates` is disabled.
 * @example
 * `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`
 */
export const updateId: string | null =
  ExpoUpdates.updateId && typeof ExpoUpdates.updateId === 'string'
    ? ExpoUpdates.updateId.toLowerCase()
    : null;

/**
 * The channel name of the current build, if configured for use with EAS Update. `null` otherwise.
 *
 * Expo Go and development builds are not set to a specific channel and can run any updates compatible with their native runtime. Therefore, this value will always be `null` when running an update on Expo Go or a development build.
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
 * Determines if and when `expo-updates` checks for and downloads updates automatically on startup.
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
export const isEmergencyLaunch = ExpoUpdates.isEmergencyLaunch;

/**
 * If `isEmergencyLaunch` is set to true, this will contain a string error message describing
 * what failed during initialization.
 */
export const emergencyLaunchReason = ExpoUpdates.emergencyLaunchReason;

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

/**
 * During non-expo development we block accessing the updates API methods on the JS side, but when developing in
 * Expo Go or a development client build, the controllers should have control over which API methods should
 * be allowed.
 */
const shouldDeferToNativeForAPIMethodAvailabilityInDevelopment =
  !!ExpoUpdates.shouldDeferToNativeForAPIMethodAvailabilityInDevelopment;

/**
 * Developer tool is set when a project is served by `expo start`.
 */
const isUsingDeveloperTool =
  'extra' in manifest ? !!manifest.extra?.expoGo?.developer?.tool : false;

const manualUpdatesInstructions =
  'To test usage of the expo-updates JS API in your app, make a release build with `npx expo run:ios --configuration Release` or ' +
  '`npx expo run:android --variant Release`.';

/**
 * Instructs the app to reload using the most recently downloaded version. This is useful for
 * triggering a newly downloaded update to launch without the user needing to manually restart the
 * app.
 * Unlike `Expo.reloadAppAsync()` provided by the `expo` package,
 * this function not only reloads the app but also changes the loaded JavaScript bundle to that of the most recently downloaded update.
 *
 * It is not recommended to place any meaningful logic after a call to `await
 * Updates.reloadAsync()`. This is because the promise is resolved after verifying that the app can
 * be reloaded, and immediately before posting an asynchronous task to the main thread to actually
 * reload the app. It is unsafe to make any assumptions about whether any more JS code will be
 * executed after the `Updates.reloadAsync` method call resolves, since that depends on the OS and
 * the state of the native module and main threads.
 *
 * This method cannot be used in Expo Go or development mode, and the returned promise will be rejected if you
 * try to do so. It also rejects when `expo-updates` is not enabled.
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
  if (
    (__DEV__ || isUsingDeveloperTool) &&
    !shouldDeferToNativeForAPIMethodAvailabilityInDevelopment
  ) {
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
 * The promise rejects in Expo Go or if the app is in development mode, or if there is an unexpected error or
 * timeout communicating with the server. It also rejects when `expo-updates` is not enabled.
 */
export async function checkForUpdateAsync(): Promise<UpdateCheckResult> {
  if (
    (__DEV__ || isUsingDeveloperTool) &&
    !shouldDeferToNativeForAPIMethodAvailabilityInDevelopment
  ) {
    throw new CodedError(
      'ERR_UPDATES_DISABLED',
      `You cannot check for updates in development mode. ${manualUpdatesInstructions}`
    );
  }

  const result = await ExpoUpdates.checkForUpdateAsync();
  if ('manifestString' in result) {
    const { manifestString, ...rest } = result;
    return {
      ...rest,
      manifest: JSON.parse(manifestString),
    };
  }
  return result;
}

/**
 * Retrieves the current extra params.
 *
 * This method cannot be used in Expo Go or development mode. It also rejects when `expo-updates` is not enabled.
 */
export async function getExtraParamsAsync(): Promise<Record<string, string>> {
  return await ExpoUpdates.getExtraParamsAsync();
}

/**
 * Sets an extra param if value is non-null, otherwise unsets the param.
 * Extra params are sent as an [Expo Structured Field Value Dictionary](/technical-specs/expo-sfv-0/)
 * in the `Expo-Extra-Params` header of update requests. A compliant update server may use these params when selecting an update to serve.
 *
 * This method cannot be used in Expo Go or development mode. It also rejects when `expo-updates` is not enabled.
 */
export async function setExtraParamAsync(
  key: string,
  value: string | null | undefined
): Promise<void> {
  return await ExpoUpdates.setExtraParamAsync(key, value ?? null);
}

/**
 * Retrieves the most recent `expo-updates` log entries.
 *
 * @param maxAge Sets the max age of retrieved log entries in milliseconds. Default to `3600000` ms (1 hour).
 *
 * @return A promise that fulfills with an array of [`UpdatesLogEntry`](#updateslogentry) objects;
 *
 * The promise rejects if there is an unexpected error in retrieving the logs.
 */
export async function readLogEntriesAsync(maxAge: number = 3600000): Promise<UpdatesLogEntry[]> {
  return await ExpoUpdates.readLogEntriesAsync(maxAge);
}

/**
 * Clears existing `expo-updates` log entries.
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
  await ExpoUpdates.clearLogEntriesAsync();
}

/**
 * Downloads the most recently deployed update to your project from server to the device's local
 * storage. This method cannot be used in development mode, and the returned promise will be
 * rejected if you try to do so.
 *
 > **Note:** [`reloadAsync()`](#updatesreloadasync) can be called after promise resolution to
 * reload the app using the most recently downloaded version. Otherwise, the update will be applied
 * on the next app cold start.
 *
 * @return A promise that fulfills with an [`UpdateFetchResult`](#updatefetchresult) object.
 *
 * The promise rejects in Expo Go or if the app is in development mode, or if there is an unexpected error or
 * timeout communicating with the server. It also rejects when `expo-updates` is not enabled.
 */
export async function fetchUpdateAsync(): Promise<UpdateFetchResult> {
  if (
    (__DEV__ || isUsingDeveloperTool) &&
    !shouldDeferToNativeForAPIMethodAvailabilityInDevelopment
  ) {
    throw new CodedError(
      'ERR_UPDATES_DISABLED',
      `You cannot fetch updates in development mode. ${manualUpdatesInstructions}`
    );
  }

  const result = await ExpoUpdates.fetchUpdateAsync();
  if ('manifestString' in result) {
    const { manifestString, ...rest } = result;
    return {
      ...rest,
      manifest: JSON.parse(manifestString),
    };
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

/**
 * @hidden
 */
export function transformNativeStateMachineContext(
  originalNativeContext: UpdatesNativeStateMachineContext & {
    latestManifestString?: string;
    downloadedManifestString?: string;
    lastCheckForUpdateTimeString?: string;
    rollbackString?: string;
  }
): UpdatesNativeStateMachineContext {
  const nativeContext = { ...originalNativeContext };
  if (nativeContext.latestManifestString) {
    nativeContext.latestManifest = JSON.parse(nativeContext.latestManifestString);
    delete nativeContext.latestManifestString;
  }
  if (nativeContext.downloadedManifestString) {
    nativeContext.downloadedManifest = JSON.parse(nativeContext.downloadedManifestString);
    delete nativeContext.downloadedManifestString;
  }
  if (nativeContext.lastCheckForUpdateTimeString) {
    nativeContext.lastCheckForUpdateTime = new Date(nativeContext.lastCheckForUpdateTimeString);
    delete nativeContext.lastCheckForUpdateTimeString;
  }
  if (nativeContext.rollbackString) {
    nativeContext.rollback = JSON.parse(nativeContext.rollbackString);
    delete nativeContext.rollbackString;
  }
  return nativeContext;
}

/**
 * @hidden
 */
export async function getNativeStateMachineContextAsync(): Promise<UpdatesNativeStateMachineContext> {
  const nativeContext = await ExpoUpdates.getNativeStateMachineContextAsync();
  return transformNativeStateMachineContext(nativeContext);
}
