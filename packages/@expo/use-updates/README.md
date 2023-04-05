# @expo/use-updates

A new, simpler JS API for the `expo-updates` module.

- Wrap existing asynchronous methods and native event listener
- No asynchronous methods needed
- Optional callbacks called on start, completion or error during update check or download

*Usage*


```jsx UpdatesDemo.tsx
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
  const runTypeMessage = updatesInfo.currentlyRunning.isEmbeddedLaunch
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

