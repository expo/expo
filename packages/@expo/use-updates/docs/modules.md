[@expo/use-updates](README.md) / Exports

# @expo/use-updates

## Table of contents

### Type Aliases

- [AvailableUpdateInfo](modules.md#availableupdateinfo)
- [CurrentlyRunningInfo](modules.md#currentlyrunninginfo)
- [UseUpdatesReturnType](modules.md#useupdatesreturntype)

### Functions

- [checkForUpdate](modules.md#checkforupdate)
- [downloadUpdate](modules.md#downloadupdate)
- [readLogEntries](modules.md#readlogentries)
- [runUpdate](modules.md#runupdate)
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
| `manifest` | `Manifest` | The [manifest](https://docs.expo.dev/versions/latest/sdk/constants/#manifest) for the update. |
| `updateId` | `string` \| ``null`` | A string that uniquely identifies the update. For the manifests used in the current Expo Updates protocol (including EAS Update), this represents the update's UUID in its canonical string form (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) and will always use lowercase letters. |

#### Defined in

[UseUpdates.types.ts:69](https://github.com/expo/expo/blob/2ba5489d17/packages/@expo/use-updates/src/UseUpdates.types.ts#L69)

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
| `manifest` | `Partial`<`Manifest`\> \| ``null`` | If `expo-updates` is enabled, this is the [manifest](https://docs.expo.dev/versions/latest/sdk/updates/#updatesmanifest) object for the update that's currently running. In development mode, or any other environment in which `expo-updates` is disabled, this object is empty. |
| `runtimeVersion` | `string` \| ``null`` | The runtime version of the current build. |
| `updateId` | `string` \| ``null`` | The UUID that uniquely identifies the currently running update if `expo-updates` is enabled. The UUID is represented in its canonical string form (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) and will always use lowercase letters. In development mode, or any other environment in which `expo-updates` is disabled, this value is `null`. |

#### Defined in

[UseUpdates.types.ts:15](https://github.com/expo/expo/blob/2ba5489d17/packages/@expo/use-updates/src/UseUpdates.types.ts#L15)

___

### UseUpdatesReturnType

Ƭ **UseUpdatesReturnType**: `Object`

The structures and methods returned by `useUpdates()`.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `availableUpdate?` | [`AvailableUpdateInfo`](modules.md#availableupdateinfo) | If a new available update has been found, either by using checkForUpdate(), or by the `UpdateEvent` listener in `useUpdates()`, this will contain the information for that update. |
| `currentlyRunning` | [`CurrentlyRunningInfo`](modules.md#currentlyrunninginfo) | Information on the currently running app |
| `error?` | `Error` | If an error is returned by any of the APIs to check for, download, or launch updates, the error description will appear here. |
| `isUpdateAvailable` | `boolean` | True if a new available update has been found, false otherwise. |
| `isUpdatePending` | `boolean` | True if a new available update is available and has been downloaded. |
| `lastCheckForUpdateTimeSinceRestart?` | `Date` | A `Date` object representing the last time this client checked for an available update, or `undefined` if no check has yet occurred since the app started. Does not persist across app reloads or restarts. |
| `logEntries?` | `UpdatesLogEntry`[] | If present, contains items of type [UpdatesLogEntry](https://docs.expo.dev/versions/latest/sdk/updates/#updateslogentry) returned by the `getLogEntries()` method. |

#### Defined in

[UseUpdates.types.ts:89](https://github.com/expo/expo/blob/2ba5489d17/packages/@expo/use-updates/src/UseUpdates.types.ts#L89)

## Functions

### checkForUpdate

▸ **checkForUpdate**(): `void`

Calls [`Updates.checkForUpdateAsync()`](https://docs.expo.dev/versions/latest/sdk/updates/#updatescheckforupdateasync)
and refreshes the `availableUpdate` property with the result.
If an error occurs, the `error` property will be set.

#### Returns

`void`

#### Defined in

[UseUpdates.ts:13](https://github.com/expo/expo/blob/2ba5489d17/packages/@expo/use-updates/src/UseUpdates.ts#L13)

___

### downloadUpdate

▸ **downloadUpdate**(): `void`

Downloads an update, if one is available, using
[`Updates.fetchUpdateAsync()`](https://docs.expo.dev/versions/latest/sdk/updates/#updatesfetchupdateasync).
This should not be called unless `isUpdateAvailable` is true.
If an error occurs, the `error` property will be set.

#### Returns

`void`

#### Defined in

[UseUpdates.ts:40](https://github.com/expo/expo/blob/2ba5489d17/packages/@expo/use-updates/src/UseUpdates.ts#L40)

___

### readLogEntries

▸ **readLogEntries**(`maxAge?`): `void`

Calls `Updates.readLogEntriesAsync()` and sets the `logEntries` property to the results.
If an error occurs, the `error` property will be set.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `maxAge?` | `number` | Max age of log entries to read, in ms. Defaults to 3600000 (1 hour). |

#### Returns

`void`

#### Defined in

[UseUpdates.ts:81](https://github.com/expo/expo/blob/2ba5489d17/packages/@expo/use-updates/src/UseUpdates.ts#L81)

___

### runUpdate

▸ **runUpdate**(): `void`

Runs an update by calling [`Updates.reloadAsync()`](https://docs.expo.dev/versions/latest/sdk/updates/#updatesreloadasync).
This instructs the app to reload using the most recently downloaded version.
This is useful for triggering a newly downloaded update to launch without the user needing to manually restart the app.
This should not be called unless there is an available update
that has already been successfully downloaded (`isUpdatePending` is true).
If an error occurs, the `error` property will be set.

#### Returns

`void`

#### Defined in

[UseUpdates.ts:66](https://github.com/expo/expo/blob/2ba5489d17/packages/@expo/use-updates/src/UseUpdates.ts#L66)

___

### useUpdates

▸ **useUpdates**(): [`UseUpdatesReturnType`](modules.md#useupdatesreturntype)

Hook that obtains information on available updates and on the currently running update.

**`Example`**

```tsx UpdatesDemo.tsx
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { UseUpdatesEvent } from '@expo/use-updates';
import {
  useUpdates,
  checkForUpdate,
  downloadUpdate,
  runUpdate,
} from '@expo/use-updates';

export default function UpdatesDemo() {
  const { currentlyRunning, availableUpdate, isUpdateAvailable, isUpdatePending } = useUpdates();

  React.useEffect(() => {
    if (isUpdatePending) {
      // Update has successfully downloaded
      runUpdate();
    }
  }, [isUpdatePending]);

  // If true, we show the button to download and run the update
  const showDownloadButton = isUpdateAvailable;

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

#### Returns

[`UseUpdatesReturnType`](modules.md#useupdatesreturntype)

the structures with information on currently running and available updates.

#### Defined in

[UseUpdates.ts:148](https://github.com/expo/expo/blob/2ba5489d17/packages/@expo/use-updates/src/UseUpdates.ts#L148)
