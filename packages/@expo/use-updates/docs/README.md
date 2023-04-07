@expo/use-updates / [Exports](modules.md)

# @expo/use-updates

A simpler JavaScript API for the [`expo-updates`](https://docs.expo.dev/versions/latest/sdk/updates/) module.

- Wrap existing asynchronous methods and native event listener
- No asynchronous methods needed
- Optional event listener receives events when update available/not available, download starts, download completes

## Usage

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
