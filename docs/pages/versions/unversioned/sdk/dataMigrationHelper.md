---
title: DataMigrationHelper
---

**`DataMigrationHelper`** helps you to solve a problem with missing files after SDK upgrade on Android.
The problem only occurs when the ejected/standalone application is upgraded from SDK 32 or below to SDK 33 or above.

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
`conflictResolver` argument is optional and if it is possible to leave it empty we encourage to do so because the method runs faster without it.

 If you don't pass any conflict resolver and current document directory already contains a file with the same relative path as a file in the legacy directory then it will be overwritten.

 There is no need to check if the method was already called (We check that).

> no-op on all platforms except Android

### `interface DataMigrationHelper.ContentResolver`

```js

export interface ConflictResolver {
  onConflict(legacyFile: string, currentFile: string): Promise<void>;
};

```

In some cases, you may want to decide separately for each file conflict how it should be resolved.
Object that implements `ConflictResolver` interface can be passed to `DataMigrationHelper.migrateFilesFromLegacyDirectoryAsync()` as an argument.
`onConflict` method will be called for each file that already exists in both legacy and current document directories. 

One of the common situations is when one wants to move only files that don't generate conflicts. 
DataMigrationHelper exports conflict resolver for such a case: `DataMigrationHelper.NOOP_CONFLICT_RESOLVER`.
