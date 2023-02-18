/**
 * Test app that shows some features of the Updates API
 */
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [updateMessage, setUpdateMessage] = React.useState('');

  // Displays a message showing whether or not the app is running
  // a downloaded update
  const runTypeMessage = Updates.isEmbeddedLaunch
    ? 'This app is running from built-in code'
    : 'This app is running an update';

  /**
   * Async function to fetch and load the most recent update from EAS.
   * There is no need to call checkForUpdateAsync() since this is run
   * only when the listener receives an UPDATE_AVAILABLE event; however,
   * we call it here anyway for testing purposes.
   */
  const downloadAndRunUpdateAsync = async () => {
    await delay(2000);
    setUpdateMessage('Calling checkForUpdateAsync...');
    const checkResult = await Updates.checkForUpdateAsync();
    if (checkResult.isAvailable) {
      setUpdateMessage(
        `checkForUpdateAsync found a new update: manifest = \n${manifestToString(
          checkResult.manifest
        )}...`
      );
    } else {
      setUpdateMessage(`Something went wrong, checkForUpdateAsync found no update.}`);
      return;
    }
    await delay(2000);
    setUpdateMessage('Downloading the new update...');
    await Updates.fetchUpdateAsync();
    setUpdateMessage('Downloaded update... launching it in 2 seconds.');
    await delay(2000);
    await Updates.reloadAsync();
  };

  /**
   * Sample UpdateEvent listener that handles all three event types
   * @param {} event The event to handle
   */
  const eventListener = (event: Updates.UpdateEvent) => {
    if (event.type === Updates.UpdateEventType.ERROR) {
      setUpdateMessage(`Error: ${event.message}`);
    } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
      setUpdateMessage('No new update available');
    } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
      setUpdateMessage(`New update available\n${manifestToString(event.manifest)}`);
      downloadAndRunUpdateAsync().catch((error) => {
        setUpdateMessage(`Error downloading and running update: ${error.message}`);
      });
    }
  };
  useUpdateEvents(eventListener);

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Text>{runTypeMessage}</Text>
      <Text>{updateMessage}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

///////////////////////////

/**
 * Hook for managing UpdateEvent listener subscription
 * @param {*} listener The UpdateEvent listener
 */
const useUpdateEvents = (listener: (event: Updates.UpdateEvent) => void) => {
  React.useEffect(() => {
    const subscription = Updates.addListener(listener);
    return () => {
      subscription.remove();
    };
  }, []);
};

/**
 * Promise wrapper for setTimeout()
 * @param {*} timeout Timeout in ms
 * @returns a Promise that resolves after the timeout has elapsed
 */
const delay = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

const manifestToString = (manifest?: Updates.Manifest) => {
  return manifest
    ? JSON.stringify(
        {
          id: manifest.id,
          createdAt: manifest.createdAt,
          metadata: manifest.metadata,
        },
        null,
        2
      )
    : 'null';
};
