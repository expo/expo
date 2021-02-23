---
title: Updates
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-38/packages/expo/src/Updates'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

The `Updates` API from **`expo`** allows you to programatically control and respond to over-the-air updates to your app.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-updates" />

Since extra setup is required to use this module in bare React Native apps, for easiest use we recommend using a template project with `expo-updates` already installed. You can use `expo init --template=expo-template-bare-minimum` to initialize a new project from such a template.

> Most of the methods and constants in this module can only be used or tested in release mode; they do not make sense in debug builds where you always load the latest JS from your computer while developing. To test manual updates in the Expo client, run `expo publish` and then open the published version of your app with the Expo client. To test manual updates in Bare workflow apps, make a release build with `npm run ios --configuration Release` or `npm run android --variant Release` (you don't need to submit this build to the App/Play Store to test).

### Legacy API

In previous Expo SDK versions, the Updates module was imported from the `expo` package. It has now moved to its own separate package, `expo-updates`. The new module has a similar but slightly different JS API from the Updates module included with the `expo` package. You can still import the old Updates module from the `expo` package with the old API, which is identical to the [SDK 36 Updates API](../../v36.0.0/sdk/updates.md), though it will log a deprecation warning when imported in development. The Updates module export will be removed from the `expo` package in SDK 39, and we recommend you switch to the new `expo-updates` module soon.

The changes in the new API are as follows:

- `Updates.fetchUpdateAsync` no longer accepts any arguments. (It still resolves when an update is finished downloading.)
- The listener in `Updates.addListener` will only receive events about automatically downloaded updates, not downloads triggered manually by `Updates.fetchUpdateAsync`.
- Event names have changed: `DOWNLOAD_FINISHED` has become `UPDATE_AVAILABLE`, and `DOWNLOAD_START` events are no longer emitted.
- `Updates.reloadFromCache` has been renamed to `Updates.reloadAsync`, and `Updates.reload` has been removed.

## API

```js
import * as Updates from 'expo-updates';
```

## Constants

### `Updates.isEmergencyLaunch`

(_boolean_) `expo-updates` does its very best to always launch monotonically newer versions of your app so you don't need to worry about backwards compatibility when you put out an update. In very rare cases, it's possible that `expo-updates` may need to fall back to the update that's embedded in the app binary, even after newer updates have been downloaded and run (an "emergency launch"). This boolean will be `true` if the app is launching under this fallback mechanism and `false` otherwise. If you are concerned about backwards compatibility of future updates to your app, you can use this constant to provide special behavior for this rare case.

### `Updates.manifest`

(_object_) If `expo-updates` is enabled, this is the [manifest](../../../workflow/how-expo-works.md#expo-development-server) object for the update that's currently running.

In development mode, or any other environment in which `expo-updates` is disabled, this object is empty.

### `Updates.releaseChannel`

(_string_) The name of the release channel currently configured in this standalone or bare app.

### `Updates.updateId`

(_string | null_) If `expo-updates` is enabled, the UUID that uniquely identifies the currently running update. The UUID is represented in its canonical string form (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) and will always use lowercase letters. In development mode, or any other environment in which `expo-updates` is disabled, this value is null.

## Methods

### `Updates.reloadAsync()`

Instructs the app to reload using the most recently downloaded version. This is useful for triggering a newly downloaded update to launch without the user needing to manually restart the app.

It is not recommended to place any meaningful logic after a call to `await Updates.reloadAsync()`. This is because the `Promise` is resolved after verifying that the app can be reloaded, and immediately before posting an asynchronous task to the main thread to actually reload the app. It is unsafe to make any assumptions about whether any more JS code will be executed after the `Updates.reloadAsync` method call resolves, since that depends on the OS and the state of the native module and main threads.

This method cannot be used in development mode, and the returned `Promise` will be rejected if you try to do so.

#### Returns

A `Promise` that resolves right before the reload instruction is sent to the JS runtime, or rejects if it cannot find a reference to the JS runtime.

If the `Promise` is rejected in production mode, it most likely means you have installed the module incorrectly. Double check you've followed the instructions above. In particular, on iOS ensure that you set the `bridge` property on `EXUpdatesAppController` with a pointer to the `RCTBridge` you want to reload, and on Android ensure you either call `UpdatesController.initialize` with the instance of `ReactApplication` you want to reload, or call `UpdatesController.setReactNativeHost` with the proper instance of `ReactNativeHost`.

### `Updates.checkForUpdateAsync()`

Checks the server to see if a newly deployed update to your project is available. Does not actually download the update.

This method cannot be used in development mode, and the returned `Promise` will be rejected if you try to do so.

#### Returns

A `Promise` that resolves to an object with the following keys:

- **isAvailable (_boolean_)** -- `true` if an update is available, `false` if you're already running the most up-to-date JS bundle.
- **manifest (_object_)** -- If `isAvailable` is true, the manifest of the available update. Undefined otherwise.

The `Promise` rejects if the app is in development mode, or if there is an unexpected error communicating with the server.

### `Updates.fetchUpdateAsync()`

Downloads the most recently deployed update to your project from server to the device's local storage.

This method cannot be used in development mode, and the returned `Promise` will be rejected if you try to do so.

#### Returns

A `Promise` that resolves to an object with the following keys:

- **isNew (_boolean_)** -- `true` if the fetched bundle is new (i.e. a different version than what's currently running), `false` otherwise.
- **manifest (_object_)** -- If `isNew` is true, the manifest of the newly downloaded update. Undefined otherwise.

The `Promise` rejects if the app is in development mode, or if there is an unexpected error communicating with the server.

### `Updates.addListener(eventListener)`

Adds a callback to be invoked when updates-related events occur (such as upon the initial app load) due to auto-update settings chosen at build-time.

#### Arguments

- **eventListener (_(event: [UpdateEvent](#updateevent)) => void_)** -- A function that will be invoked with an instance of [`UpdateEvent`](#updateevent) and should not return any value.

#### Returns

An [`EventSubscription`](#eventsubscription) object on which you can call `remove()` if you would like to unsubscribe from the listener.

## Related Types

### `EventSubscription`

An object returned from `addListener`.

- **remove() (_function_)** -- Unsubscribe the listener from future updates.

### `UpdateEvent`

An object that is passed into each event listener when an auto-update check has occurred.

- **type (_string_)** -- Type of the event (see [`UpdateEventType`](#updateeventtype)).
- **manifest (_object_)** -- If `type === Updates.UpdateEventType.UPDATE_AVAILABLE`, the manifest of the newly downloaded update. Undefined otherwise.
- **message (_string_)** -- If `type === Updates.UpdateEventType.ERROR`, the error message. Undefined otherwise.

### `UpdateEventType`

- **`Updates.UpdateEventType.UPDATE_AVAILABLE`** -- A new update has finished downloading to local storage. If you would like to start using this update at any point before the user closes and restarts the app on their own, you can call `Updates.reloadAsync()` to launch this new update.
- **`Updates.UpdateEventType.NO_UPDATE_AVAILABLE`** -- No updates are available, and the most up-to-date bundle of this experience is already running.
- **`Updates.UpdateEventType.ERROR`** -- An error occurred trying to fetch the latest update.

## Error Codes

| Code                   | Description                                                                                                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ERR_UPDATES_DISABLED` | A method call was attempted when the Updates module was disabled, or the application was running in development mode                                                                                                                                          |
| `ERR_UPDATES_RELOAD`   | An error occurred when trying to reload the application and it could not be reloaded. For bare workflow apps, double check the setup steps for this module to ensure it has been installed correctly and the proper native initialization methods are called. |
| `ERR_UPDATES_CHECK`    | An unexpected error occurred when trying to check for new updates. Check the error message for more information.                                                                                                                                              |
| `ERR_UPDATES_FETCH`    | An unexpected error occurred when trying to fetch a new update. Check the error message for more information.                                                                                                                                                 |
