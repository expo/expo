import { LocalAssets, Manifest, UpdateCheckResult, UpdateFetchResult, UpdatesCheckAutomaticallyValue, UpdatesLogEntry, UpdatesNativeStateMachineContext } from './Updates.types';
/**
 * Whether `expo-updates` is enabled. This may be false in a variety of cases including:
 * - enabled set to false in configuration
 * - missing or invalid URL in configuration
 * - missing runtime version or SDK version in configuration
 * - error accessing storage on device during initialization
 *
 * When false, the embedded update is loaded.
 */
export declare const isEnabled: boolean;
/**
 * The UUID that uniquely identifies the currently running update. The
 * UUID is represented in its canonical string form and will always use lowercase letters.
 * This value is `null` when running in a local development environment or any other environment where `expo-updates` is disabled.
 * @example
 * `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`
 */
export declare const updateId: string | null;
/**
 * The channel name of the current build, if configured for use with EAS Update. `null` otherwise.
 *
 * Expo Go and development builds are not set to a specific channel and can run any updates compatible with their native runtime. Therefore, this value will always be `null` when running an update on Expo Go or a development build.
 */
export declare const channel: string | null;
/**
 * The runtime version of the current build.
 */
export declare const runtimeVersion: string | null;
/**
 * Determines if and when `expo-updates` checks for and downloads updates automatically on startup.
 */
export declare const checkAutomatically: UpdatesCheckAutomaticallyValue | null;
/**
 * @hidden
 */
export declare const localAssets: LocalAssets;
/**
 * `expo-updates` does its very best to always launch monotonically newer versions of your app so
 * you don't need to worry about backwards compatibility when you put out an update. In very rare
 * cases, it's possible that `expo-updates` may need to fall back to the update that's embedded in
 * the app binary, even after newer updates have been downloaded and run (an "emergency launch").
 * This boolean will be `true` if the app is launching under this fallback mechanism and `false`
 * otherwise. If you are concerned about backwards compatibility of future updates to your app, you
 * can use this constant to provide special behavior for this rare case.
 */
export declare const isEmergencyLaunch: boolean;
/**
 * If `isEmergencyLaunch` is set to true, this will contain a string error message describing
 * what failed during initialization.
 */
export declare const emergencyLaunchReason: string | null;
/**
 * This will be true if the currently running update is the one embedded in the build,
 * and not one downloaded from the updates server.
 */
export declare const isEmbeddedLaunch: boolean;
/**
 * @hidden
 */
export declare const isUsingEmbeddedAssets: boolean;
/**
 * If `expo-updates` is enabled, this is the
 * [manifest](/versions/latest/sdk/constants/#manifest) (or
 * [classic manifest](/versions/latest/sdk/constants/#appmanifest))
 * object for the update that's currently running.
 *
 * In development mode, or any other environment in which `expo-updates` is disabled, this object is
 * empty.
 */
export declare const manifest: Partial<Manifest>;
/**
 * If `expo-updates` is enabled, this is a `Date` object representing the creation time of the update that's currently running (whether it was embedded or downloaded at runtime).
 *
 * In development mode, or any other environment in which `expo-updates` is disabled, this value is
 * null.
 */
export declare const createdAt: Date | null;
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
export declare function reloadAsync(): Promise<void>;
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
export declare function checkForUpdateAsync(): Promise<UpdateCheckResult>;
/**
 * Retrieves the current extra params.
 *
 * This method cannot be used in Expo Go or development mode. It also rejects when `expo-updates` is not enabled.
 */
export declare function getExtraParamsAsync(): Promise<Record<string, string>>;
/**
 * Sets an extra param if value is non-null, otherwise unsets the param.
 * Extra params are sent as an [Expo Structured Field Value Dictionary](/technical-specs/expo-sfv-0/)
 * in the `Expo-Extra-Params` header of update requests. A compliant update server may use these params when selecting an update to serve.
 *
 * This method cannot be used in Expo Go or development mode. It also rejects when `expo-updates` is not enabled.
 */
export declare function setExtraParamAsync(key: string, value: string | null | undefined): Promise<void>;
/**
 * Retrieves the most recent `expo-updates` log entries.
 *
 * @param maxAge Sets the max age of retrieved log entries in milliseconds. Default to `3600000` ms (1 hour).
 *
 * @return A promise that fulfills with an array of [`UpdatesLogEntry`](#updateslogentry) objects;
 *
 * The promise rejects if there is an unexpected error in retrieving the logs.
 */
export declare function readLogEntriesAsync(maxAge?: number): Promise<UpdatesLogEntry[]>;
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
export declare function clearLogEntriesAsync(): Promise<void>;
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
export declare function fetchUpdateAsync(): Promise<UpdateFetchResult>;
/**
 * @hidden
 */
export declare function clearUpdateCacheExperimentalAsync(_sdkVersion?: string): void;
/**
 * @hidden
 */
export declare function transformNativeStateMachineContext(originalNativeContext: UpdatesNativeStateMachineContext & {
    latestManifestString?: string;
    downloadedManifestString?: string;
    lastCheckForUpdateTimeString?: string;
    rollbackString?: string;
}): UpdatesNativeStateMachineContext;
/**
 * @hidden
 */
export declare function getNativeStateMachineContextAsync(): Promise<UpdatesNativeStateMachineContext>;
//# sourceMappingURL=Updates.d.ts.map