import { EventSubscription } from 'fbemitter';
import { LocalAssets, Manifest, UpdateCheckResult, UpdateEvent, UpdateFetchResult } from './Updates.types';
export * from './Updates.types';
/**
 * If `expo-updates` is enabled, the UUID that uniquely identifies the currently running update.
 * The UUID is represented in its canonical string form (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
 * and will always use lowercase letters. In development mode, or any other environment in which
 * `expo-updates` is disabled, this value is `null`.
 */
export declare const updateId: string | null;
/**
 * The name of the release channel currently configured in this standalone or bare app.
 */
export declare const releaseChannel: string;
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
 * @hidden
 */
export declare const isUsingEmbeddedAssets: boolean;
/**
 * If `expo-updates` is enabled, this is the [manifest](/guides/how-expo-works#expo-development-server)
 * object for the update that's currently running.
 *
 * In development mode, or any other environment in which `expo-updates` is disabled, this object is empty.
 */
export declare const manifest: Manifest | object;
/**
 * Instructs the app to reload using the most recently downloaded version. This is useful for
 * triggering a newly downloaded update to launch without the user needing to manually restart the app.
 *
 * It is not recommended to place any meaningful logic after a call to `await Updates.reloadAsync()`.
 * This is because the `Promise` is resolved after verifying that the app can be reloaded, and
 * immediately before posting an asynchronous task to the main thread to actually reload the app.
 * It is unsafe to make any assumptions about whether any more JS code will be executed after the
 * `Updates.reloadAsync` method call resolves, since that depends on the OS and the state of the
 * native module and main threads.
 *
 * This method cannot be used in development mode, and the returned `Promise` will be rejected if you try to do so.
 *
 * @return Returns a `Promise` that fulfils right before the reload instruction is sent to the JS runtime,
 * or rejects if it cannot find a reference to the JS runtime.
 * If the `Promise` is rejected in production mode, it most likely means you have installed the
 * module incorrectly. Double check you've followed the instructions above. In particular, on iOS
 * ensure that you set the `bridge` property on `EXUpdatesAppController` with a pointer to the
 * `RCTBridge` you want to reload, and on Android ensure you either call `UpdatesController.initialize`
 * with the instance of `ReactApplication` you want to reload, or call `UpdatesController.setReactNativeHost`
 * with the proper instance of `ReactNativeHost`.
 */
export declare function reloadAsync(): Promise<void>;
/**
 * Checks the server to see if a newly deployed update to your project is available. Does not
 * actually download the update. This method cannot be used in development mode, and the returned
 * `Promise` will be rejected if you try to do so.
 * @return A Promise that fulfils with [`UpdateCheckResult`](#updatecheckresult) object.
 *
 * The `Promise` rejects if the app is in development mode, or if there is an unexpected error or
 * timeout communicating with the server.
 */
export declare function checkForUpdateAsync(): Promise<UpdateCheckResult>;
/**
 * Downloads the most recently deployed update to your project from server to the device's local storage.
 * This method cannot be used in development mode, and the returned `Promise` will be rejected if
 * you try to do so.
 * @return A Promise that fulfils with [`UpdateFetchResult`](#updatefetchresult) object.
 *
 * The Promise rejects if the app is in development mode, or if there is an unexpected error or
 * timeout communicating with the server.
 */
export declare function fetchUpdateAsync(): Promise<UpdateFetchResult>;
/**
 * @hidden
 */
export declare function clearUpdateCacheExperimentalAsync(_sdkVersion?: string): void;
/**
 * Adds a callback to be invoked when updates-related events occur (such as upon the initial app load)
 * due to auto-update settings chosen at build-time.
 * @param listener A function that will be invoked with an instance of [`UpdateEvent`](#updateevent)
 * and should not return any value.
 * @return Returns an `EventSubscription` object on which you can call `remove()` if
 * you would like to unsubscribe from the listener.
 */
export declare function addListener(listener: (event: UpdateEvent) => void): EventSubscription;
