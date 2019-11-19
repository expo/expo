---
title: DataMigrationHelper
---

**`DataMigrationHelper`** allows manual control over migrating `FileSystem` files from the legacy directory on Android.
In SDK 33, the location of the `FileSystem.documentDirectory` was changed for standalone apps from a scoped to an unscoped directory. The Expo runtime attempts to migrate files to the new location automatically; however, we provide this manual helper class in case you need more fine-grained control.

## How to use

- **If you are upgrading your standalone app from SDK 32 or below** and use the `FileSystem` API, we recommend running `DataMigrationHelper.migrateFilesFromLegacyDirectoryAsync()` as early as possible in your app's lifecycle to properly migrate old files. After this, you should be good to go.
- **If you have already upgraded your standalone app from SDK 32 or below to SDKs 33-35 and are upgrading again**, and use the `FileSystem` API, we recommend calling `DataMigrationHelper.migrateFilesFromLegacyDirectoryAsync(DataMigrationHelper.noopResolve)` as early as possible in your app's lifecycle. This will migrate files from the legacy directory only if files with the same name do not already exist in the new location -- allowing you migrate old users without fear of overwriting newly created data for newer users.
- **If your app never used the `FileSystem` API in SDK 32 or below**, there is no need for you to use this module.

## API

```js
import { DataMigrationHelper } from 'expo';
```

### `DataMigrationHelper.getLegacyDocumentDirectoryAndroid(): string | null`

Returns the path to the legacy document directory which can be used by `expo-file-system`.

> Returns null on all platforms except Android

### `DataMigrationHelper.migrateFilesFromLegacyDirectoryAsync(conflictResolver?: ConflictResolver): Promise<void>`

```js

export default class App extends React.Component {
  state = {
    movedFiles: false,
  };

  render() {
    const { movedFiles } = this.state;

    if (!movedFiles) {
      return (
        <AppLoading
          startAsync={this._moveFiles}
          onFinish={() => this.setState({ movedFiles: true })}
          onError={console.warn}
        />
      );
    }

    return (
      ...
    );
  }

  async _moveFiles() {
    await DataMigrationHelper.migrateFilesFromLegacyDirectoryAsync(); 
  }
  ...
}

```

This method moves all files from the legacy directory to the current document directory. 
The `conflictResolver` argument is optional, and if it is possible to leave it empty, we encourage doing so because the method runs faster without it.

If no `conflictResolver` is provided, and there is a naming conflict between any file in the current and legacy directories, the file in the current directory will be overwritten.

This method is idempotent; there is no need to check whether it has already been called.

> no-op on all platforms except Android

### `interface DataMigrationHelper.ContentResolver`

```js

export interface ConflictResolver {
  (legacyFile: string, currentFile: string): Promise<void>;
}

```

In some cases, you may want to decide separately for each file conflict how it should be resolved.
Object that implements `ConflictResolver` interface can be passed to `DataMigrationHelper.migrateFilesFromLegacyDirectoryAsync()` as an argument.
Conflict resolver function will be called for each file that already exists in both legacy and current document directories. 

One of the common situations is when one wants to move only files that don't generate conflicts. 
DataMigrationHelper exports conflict resolver for such a case: `DataMigrationHelper.noopResolve`.
