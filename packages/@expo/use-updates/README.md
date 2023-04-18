# @expo/use-updates

An easier to use, declarative JavaScript API for the [`expo-updates`](https://docs.expo.dev/versions/latest/sdk/updates/) module. The API wraps existing asynchronous methods and does not require the developer to add an event listener. This API is in an early stage of development, and is subject to change, including breaking changes.

## Known issues

We intend to resolve the following issues before the first stable release.

- If `Updates` APIs such as `checkForUpdateAsync()` are used directly, the properties returned by the `useUpdates()` hook in this module will not be refreshed automatically. To ensure correct behavior, we recommend that `checkForUpdateAsync()`, `fetchUpdateAsync()`, and `reloadAsync()` not be used directly when using the `useUpdates()` hook.
- If the app is configured to [download and run updates automatically](https://docs.expo.dev/versions/latest/config/app/#checkautomatically), then the `useUpdates()` hook should be added near the root level of the application code, so that the events emitted by automatic update checks are detected.

## Example usage

```tsx UpdatesDemo.tsx
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useUpdates, checkForUpdate, downloadUpdate, runUpdate } from '@expo/use-updates';

export default function UpdatesDemo() {
  const { currentlyRunning, availableUpdate, isUpdateAvailable, isUpdatePending } = useUpdates();

  // If true, we show the button to download and run the update
  const showDownloadButton = isUpdateAvailable;

  React.useEffect(() => {
    if (isUpdatePending) {
      // Update has been successfully downloaded
      runUpdate();
    }
  }, [isUpdatePending]);

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

function Button(props: { text: string; pressHandler: () => void }) {
  const { text, pressHandler } = props;
  return (
    <Pressable
      style={({ pressed }) => {
        return pressed ? [styles.button, styles.buttonPressed] : styles.button;
      }}
      onPress={pressHandler}>
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
}
```

## [API docs](docs/modules.md)
