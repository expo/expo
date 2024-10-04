import { EventSubscription } from 'fbemitter';
import { LocalAssets, Manifest, UpdateCheckResult, UpdateEvent, UpdateFetchResult, UpdatesLogEntry } from './Updates.types';
export * from './Updates.types';
/**
 * The UUID that uniquely identifies the currently running update if `expo-updates` is enabled. The
 * UUID is represented in its canonical string form (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) and
 * will always use lowercase letters. In development mode, or any other environment in which
 * `expo-updates` is disabled, this value is `null`.
 */
export declare const updateId: string | null;
/**
 * The name of the release channel currently configured in this standalone or bare app when using
 * classic updates. When using Expo Updates, the value of this field is always `"default"`.
 */
export declare const releaseChannel: string;
/**
 * The channel name of the current build, if configured for use with EAS Update. Null otherwise.
 */
export declare const channel: string | null;
/**
 * The runtime version of the current build.
 */
export declare const runtimeVersion: string | null;
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
 * [manifest](/workflow/expo-go#manifest) object for the update that's currently
 * running.
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
 * The promise rejects if the app is in development mode, or if there is an unexpected error or
 * timeout communicating with the server.
 */
export declare function checkForUpdateAsync(): Promise<UpdateCheckResult>;
/**
 * Retrieves the most recent expo-updates log entries.
 *
 * @param maxAge Sets the max age of retrieved log entries in milliseconds. Default to 3600000 ms (1 hour).
 *
 * @return A promise that fulfills with an array of [`UpdatesLogEntry`](#updateslogentry) objects;
 *
 * The promise rejects if there is an unexpected error in retrieving the logs.
 */
export declare function readLogEntriesAsync(maxAge?: number): Promise<UpdatesLogEntry[]>;
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
export declare function clearLogEntriesAsync(): Promise<void>;
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
export declare function fetchUpdateAsync(): Promise<UpdateFetchResult>;
/**
 * @hidden
 */
export declare function clearUpdateCacheExperimentalAsync(_sdkVersion?: string): void;
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
export declare function addListener(listener: (event: UpdateEvent) => void): EventSubscription;
//# sourceMappingURL=Updates.d.ts.map