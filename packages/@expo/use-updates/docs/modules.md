[@expo/use-updates](README.md) / Exports

# @expo/use-updates

## Table of contents

### Enumerations

- [UpdatesLogEntryCode](enums/UpdatesLogEntryCode.md)
- [UpdatesLogEntryLevel](enums/UpdatesLogEntryLevel.md)

### Type Aliases

- [AvailableUpdateInfo](modules.md#availableupdateinfo)
- [CurrentlyRunningInfo](modules.md#currentlyrunninginfo)
- [Manifest](modules.md#manifest)
- [UpdatesLogEntry](modules.md#updateslogentry)

### Functions

- [useUpdates](modules.md#useupdates)

## Type Aliases

### AvailableUpdateInfo

Ƭ **AvailableUpdateInfo**: `Object`

Structure representing an available update that has been returned by a call to [`checkForUpdate()`](#checkforupdate)
or an [`UpdateEvent`](#updateevent) emitted by native code.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `createdAt` | `Date` \| ``null`` | A `Date` object representing the creation time of the update. |
| `manifest` | [`Manifest`](modules.md#manifest) | The manifest for the update. |
| `updateId` | `string` \| ``null`` | A string that uniquely identifies the update. For the manifests used in the current Expo Updates protocol (including EAS Update), this represents the update's UUID in its canonical string form (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) and will always use lowercase letters. |

#### Defined in

[@expo/use-updates/src/UseUpdates.types.ts:66](https://github.com/expo/expo/blob/6eb18b3915/packages/@expo/use-updates/src/UseUpdates.types.ts#L66)

___

### CurrentlyRunningInfo

Ƭ **CurrentlyRunningInfo**: `Object`

Structure encapsulating information on the currently running app
(either the embedded bundle or a downloaded update).

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `channel` | `string` \| ``null`` | The channel name of the current build, if configured for use with EAS Update. `null` otherwise. |
| `createdAt` | `Date` \| ``null`` | If `expo-updates` is enabled, this is a `Date` object representing the creation time of the update that's currently running (whether it was embedded or downloaded at runtime). In development mode, or any other environment in which `expo-updates` is disabled, this value is `null`. |
| `isEmbeddedLaunch` | `boolean` | This will be true if the currently running update is the one embedded in the build, and not one downloaded from the updates server. |
| `isEmergencyLaunch` | `boolean` | `expo-updates` does its very best to always launch monotonically newer versions of your app so you don't need to worry about backwards compatibility when you put out an update. In very rare cases, it's possible that `expo-updates` may need to fall back to the update that's embedded in the app binary, even after newer updates have been downloaded and run (an "emergency launch"). This boolean will be `true` if the app is launching under this fallback mechanism and `false` otherwise. If you are concerned about backwards compatibility of future updates to your app, you can use this constant to provide special behavior for this rare case. |
| `manifest` | `Partial`<[`Manifest`](modules.md#manifest)\> \| ``null`` | If `expo-updates` is enabled, this is the [manifest](/workflow/expo-go#manifest) object for the update that's currently running. In development mode, or any other environment in which `expo-updates` is disabled, this object is empty. |
| `runtimeVersion` | `string` \| ``null`` | The runtime version of the current build. |
| `updateId` | `string` \| ``null`` | The UUID that uniquely identifies the currently running update if `expo-updates` is enabled. The UUID is represented in its canonical string form (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) and will always use lowercase letters. In development mode, or any other environment in which `expo-updates` is disabled, this value is `null`. |

#### Defined in

[@expo/use-updates/src/UseUpdates.types.ts:12](https://github.com/expo/expo/blob/6eb18b3915/packages/@expo/use-updates/src/UseUpdates.types.ts#L12)

___

### Manifest

Ƭ **Manifest**: `ClassicManifest` \| `NonNullable`<typeof `Constants.manifest2`\>

#### Defined in

[@expo/use-updates/src/UseUpdates.types.ts:6](https://github.com/expo/expo/blob/6eb18b3915/packages/@expo/use-updates/src/UseUpdates.types.ts#L6)

___

### UpdatesLogEntry

Ƭ **UpdatesLogEntry**: `Object`

An object representing a single log entry from expo-updates logging on the client.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `assetId?` | `string` | If present, the unique ID or hash of an asset associated with this log entry. |
| `code` | [`UpdatesLogEntryCode`](enums/UpdatesLogEntryCode.md) | One of the defined code values for expo-updates log entries. |
| `level` | [`UpdatesLogEntryLevel`](enums/UpdatesLogEntryLevel.md) | One of the defined log level or severity values. |
| `message` | `string` | The log entry message. |
| `stacktrace?` | `string`[] | If present, an iOS or Android native stack trace associated with this log entry. |
| `timestamp` | `number` | The time the log was written, in milliseconds since Jan 1 1970 UTC. |
| `updateId?` | `string` | If present, the unique ID of an update associated with this log entry. |

#### Defined in

[expo-updates/build/Updates.types.d.ts:142](https://github.com/expo/expo/blob/6eb18b3915/packages/expo-updates/build/Updates.types.d.ts#L142)

## Functions

### useUpdates

▸ **useUpdates**(`callbacks?`): `Object`

Hook that obtains the Updates info structure and functions.

**`Example`**

```tsx UpdatesDemo.tsx
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useUpdates } from '@expo/use-updates';
import type { UseUpdatesCallbacksType } from '@expo/use-updates';

export default function UpdatesDemo() {
  const callbacks = {
    onDownloadUpdateComplete: () => {
      runUpdate();
    },
  };

  const { currentlyRunning, availableUpdate, checkForUpdate, downloadUpdate, runUpdate } = useUpdates();

  // If true, we show the button to download and run the update
  const showDownloadButton = availableUpdate !== undefined;

  // Show whether or not we are running embedded code or an update
  const runTypeMessage = currentlyRunning.isEmbeddedLaunch
    ? 'This app is running from built-in code'
    : 'This app is running an update';

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Updates Demo</Text>
      <Text>{runTypeMessage}</Text>
      <Button pressHandler={checkForUpdate} text="Check manually for updates" />
      {showDownloadButton ? (
        <Button pressHandler={downloadUpdate} text="Download and run update" />
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
}
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callbacks?` | `Object` | Optional set of callbacks that will be called when `checkForUpdate()`, `downloadUpdate()`, `downloadAndRunUpdate()`, or `runUpdate()`, start, complete, or have errors. |
| `callbacks.onCheckForUpdateComplete?` | () => `void` | - |
| `callbacks.onCheckForUpdateError?` | (`error?`: `Error`) => `void` | - |
| `callbacks.onCheckForUpdateStart?` | () => `void` | - |
| `callbacks.onDownloadUpdateComplete?` | () => `void` | - |
| `callbacks.onDownloadUpdateError?` | (`error?`: `Error`) => `void` | - |
| `callbacks.onDownloadUpdateStart?` | () => `void` | - |
| `callbacks.onRunUpdateError?` | (`error?`: `Error`) => `void` | - |
| `callbacks.onRunUpdateStart?` | () => `void` | - |

#### Returns

`Object`

the structures with information on currently running and available updates, and associated methods.
When using this hook, the methods returned should be used instead of `expo-updates` methods (`checkForUpdateAsync()`, `fetchUpdateAsync()`, `reloadAsync()).

| Name | Type | Description |
| :------ | :------ | :------ |
| `availableUpdate?` | [`AvailableUpdateInfo`](modules.md#availableupdateinfo) | If a new available update has been found, either by using checkForUpdate(), or by the `UpdateEvent` listener in `useUpdates()`, this will contain the information for that update. |
| `currentlyRunning` | [`CurrentlyRunningInfo`](modules.md#currentlyrunninginfo) | Information on the currently running app |
| `error?` | `Error` | If an error is returned by any of the APIs to check for, download, or launch updates, the error description will appear here. |
| `lastCheckForUpdateTimeSinceRestart?` | `Date` | A `Date` object representing the last time this client checked for an available update, or `undefined` if no check has yet occurred since the app started. Does not persist across app reloads or restarts. |
| `logEntries?` | [`UpdatesLogEntry`](modules.md#updateslogentry)[] | If present, contains `expo-updates` log entries returned by the `getLogEntries()` method. |
| `checkForUpdate` | () => `void` | Calls `Updates.checkForUpdateAsync()` and refreshes the `availableUpdate` property with the result. If an error occurs, the `error` property will be set. |
| `downloadUpdate` | () => `void` | Downloads an update, if one is available, using `Updates.fetchUpdateAsync()`. If an error occurs, the `error` property will be set. |
| `readLogEntries` | (`maxAge?`: `number`) => `void` | Calls `Updates.readLogEntriesAsync()` and sets the `logEntries` property in the `updatesInfo` structure to the results. If an error occurs, the `error` property will be set. |
| `runUpdate` | () => `void` | Runs an update by calling `Updates.reloadAsync()`. This should not be called unless there is an available update that has already been successfully downloaded using `downloadUpdate()`. If an error occurs, the `error` property will be set. |

#### Defined in

[@expo/use-updates/src/UseUpdates.ts:67](https://github.com/expo/expo/blob/6eb18b3915/packages/@expo/use-updates/src/UseUpdates.ts#L67)
