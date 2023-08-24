/**
 * Test app that shows some features of the Updates API
 */
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [showingView1, setShowingView1] = useState(true);
  const [showingView2, setShowingView2] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Updates JS API test</Text>
      <Pressable
        style={styles.button}
        onPress={() => setShowingView1((showingView1) => !showingView1)}>
        <Text style={styles.buttonText}>Toggle view 1</Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={() => setShowingView2((showingView2) => !showingView2)}>
        <Text style={styles.buttonText}>Toggle view 2</Text>
      </Pressable>
      {showingView1 ? <UpdatesStatusView index={1} /> : null}
      {showingView2 ? <UpdatesStatusView index={2} /> : null}
    </View>
  );
}

function UpdatesStatusView(props: { index: number }) {
  const [updateMessage, setUpdateMessage] = React.useState('');
  const [isRollback, setIsRollback] = React.useState(false);

  // Displays a message showing whether or not the app is running
  // a downloaded update
  const runTypeMessage =
    `isEmbeddedLaunch = ${Updates.isEmbeddedLaunch}\n` +
    `isUsingEmbeddedAssets = ${Updates.isUsingEmbeddedAssets}`;

  const checkAutomaticallyMessage = `Automatic check setting = ${Updates.checkAutomatically}`;

  const {
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
    availableUpdate,
    checkError,
    downloadError,
    lastCheckForUpdateTimeSinceRestart,
  } = Updates.useUpdates();

  useEffect(() => {
    const handleAsync = async () => {
      const state = await Updates.getNativeStateMachineContextAsync();
      setIsRollback(availableUpdate?.type === Updates.UpdateInfoType.ROLLBACK);
    };
    if (isUpdateAvailable) {
      handleAsync();
    }
  }, [isUpdateAvailable]);

  useEffect(() => {
    const checkingMessage = isChecking ? 'Checking for an update...\n' : '';
    const downloadingMessage = isDownloading ? 'Downloading...\n' : '';
    const availableMessage = isUpdateAvailable
      ? isRollback
        ? `Rollback directive found, created at ${
            availableUpdate?.createdAt.toLocaleString() ?? ''
          }\n`
        : `Found a new update: manifest = \n${manifestToString(availableUpdate?.manifest)}...` +
          '\n'
      : 'No new update available\n';
    const checkErrorMessage = checkError ? `Error in check: ${checkError.message}\n` : '';
    const downloadErrorMessage = downloadError ? `Error in check: ${downloadError.message}\n` : '';
    const lastCheckTimeMessage = lastCheckForUpdateTimeSinceRestart
      ? `Last check: ${lastCheckForUpdateTimeSinceRestart.toLocaleString() ?? ''}\n`
      : '';
    setUpdateMessage(
      checkingMessage +
        downloadingMessage +
        availableMessage +
        checkErrorMessage +
        downloadErrorMessage +
        lastCheckTimeMessage
    );
  }, [
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
    checkError,
    downloadError,
    isRollback,
  ]);

  useEffect(() => {
    const handleReloadAsync = async () => {
      let countdown = 5;
      while (countdown > 0) {
        setUpdateMessage(`Downloaded update... launching it in ${countdown} seconds.`);
        countdown = countdown - 1;
        await delay(1000);
      }
      await Updates.reloadAsync();
    };
    if (isUpdatePending) {
      handleReloadAsync();
    }
  }, [isUpdatePending]);

  const handleCheckButtonPress = () => {
    Updates.checkForUpdateAsync();
  };

  const handleDownloadButtonPress = () => {
    Updates.fetchUpdateAsync();
  };

  return (
    <View style={styles.container}>
      <Text>View {props.index}</Text>
      <Text>{runTypeMessage}</Text>
      <Text>{checkAutomaticallyMessage}</Text>
      <Text> </Text>
      <Text style={styles.titleText}>Status</Text>
      <Text style={styles.updateMessageText}>{updateMessage}</Text>
      <Pressable style={styles.button} onPress={handleCheckButtonPress}>
        <Text style={styles.buttonText}>Check manually for updates</Text>
      </Pressable>
      {isUpdateAvailable ? (
        <Pressable style={styles.button} onPress={handleDownloadButtonPress}>
          <Text style={styles.buttonText}>Download update</Text>
        </Pressable>
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: '#4630EB',
  },
  buttonText: {
    color: 'white',
  },
  updateMessageText: {
    margin: 10,
    height: 100,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: 250,
    borderColor: '#4630EB',
    borderWidth: 1,
    borderRadius: 4,
  },
  titleText: {
    fontWeight: 'bold',
  },
});

///////////////////////////

/**
 * Promise wrapper for setTimeout()
 * @param {delay} timeout Timeout in ms
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
          // metadata: manifest.metadata,
        },
        null,
        2
      )
    : 'null';
};
