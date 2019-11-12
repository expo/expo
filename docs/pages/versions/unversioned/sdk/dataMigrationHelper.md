---
title: DataMigrationHelper
---

**`DataMigrationHelper`**  helps you to solve a problem with missing files after SDK upgrade on Android.
The problem only occurs when one upgrades the ejected/standalone application from SDK 32 or below to SDK 33 or above.

## API

```js
import { DataMigrationHelper } from 'expo';
```

### `DataMigrationHelper.getLegacyDocumentDirectoryAndroid(): string | null`

This method returns the path to the legacy document directory which can be used by `expo-file-system`.

> Returns null on all platforms except Android

### `DataMigrationHelper.migrateFilesFromLegacyDirectoryAsync(): Promise<void>`

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

This method moves all files from the legacy directory to the current document directory. If the legacy directory is empty then it is a no-op. If the current document directory already contains a file with the same relative path as a file in the legacy directory then it will be overwritten.

> no-op on all platforms except Android