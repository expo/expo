import { Inter_900Black } from '@expo-google-fonts/inter';
import { useUpdates, checkForUpdate, downloadUpdate, runUpdate } from '@expo/use-updates';
import { NativeModulesProxy } from 'expo-modules-core';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { UpdatesLogEntry } from 'expo-updates';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

require('./test.png');
// eslint-disable-next-line no-unused-expressions
Inter_900Black;

function TestValue(props: { testID: string; value: string }) {
  return (
    <View>
      <Text>{props.testID}</Text>
      <Text testID={props.testID}>{props.value}</Text>
      <Text>---</Text>
    </View>
  );
}

function TestButton(props: { testID: string; onPress: () => void }) {
  return (
    <Pressable testID={props.testID} style={styles.button} onPress={props.onPress}>
      <Text style={styles.buttonText}>{props.testID}</Text>
    </Pressable>
  );
}

export default function App() {
  const [numAssetFiles, setNumAssetFiles] = React.useState(0);
  const [logs, setLogs] = React.useState<UpdatesLogEntry[]>([]);
  const [active, setActive] = React.useState(false);
  const [runNow, setRunNow] = React.useState(false);
  const [lastUpdateEventType, setLastUpdateEventType] = React.useState('');

  const { currentlyRunning, availableUpdate, isUpdateAvailable, isUpdatePending } = useUpdates();

  Updates.useUpdateEvents((event) => {
    setLastUpdateEventType(event.type);
  });

  React.useEffect(() => {
    if (isUpdatePending && runNow) {
      setTimeout(() => runUpdate(), 2000);
    }
  }, [isUpdatePending, runNow]);

  const handleReadAssetFiles = () => {
    const handleAsync = async () => {
      setActive(true);
      const numFiles = await NativeModulesProxy.ExpoUpdatesE2ETest.readInternalAssetsFolderAsync();
      await delay(1000);
      setNumAssetFiles(numFiles);
      setActive(false);
    };
    handleAsync().catch((e) => {
      console.warn(e);
    });
  };

  const handleClearAssetFiles = () => {
    const handleAsync = async () => {
      setActive(true);
      await NativeModulesProxy.ExpoUpdatesE2ETest.clearInternalAssetsFolderAsync();
      const numFiles = await NativeModulesProxy.ExpoUpdatesE2ETest.readInternalAssetsFolderAsync();
      await delay(1000);
      setNumAssetFiles(numFiles);
      setActive(false);
    };
    handleAsync().catch((e) => {
      console.warn(e);
    });
  };

  const handleReadLogEntries = () => {
    const handleAsync = async () => {
      setActive(true);
      const logEntries = await Updates.readLogEntriesAsync(60000);
      await delay(1000);
      setLogs(logEntries);
      setActive(false);
    };
    handleAsync().catch((e) => {
      console.warn(e);
    });
  };

  const handleDownloadUpdate = () => {
    setRunNow(true);
    downloadUpdate();
  };

  const logsToString = (logs: UpdatesLogEntry[]) =>
    JSON.stringify(
      logs.map((log) => {
        return {
          message: log.message,
          time: new Date(log.timestamp).toISOString(),
          code: log.code,
        };
      })
    );

  return (
    <View style={styles.container}>
      <TestValue testID="lastUpdateEventType" value={`${lastUpdateEventType}`} />
      <TestValue testID="updateString" value="test" />
      <TestValue testID="updateID" value={`${Updates.updateId}`} />
      <TestValue testID="numAssetFiles" value={`${numAssetFiles}`} />
      <TestValue testID="runtimeVersion" value={`${currentlyRunning.runtimeVersion}`} />
      <TestValue testID="isEmbeddedLaunch" value={`${currentlyRunning.isEmbeddedLaunch}`} />
      <TestValue testID="availableUpdateID" value={`${availableUpdate?.updateId}`} />
      <Text>Log messages</Text>
      <ScrollView style={styles.logEntriesContainer}>
        <Text testID="logEntries" style={styles.logEntriesText}>
          {logsToString(logs)}
        </Text>
      </ScrollView>

      {active ? <ActivityIndicator testID="activity" size="small" color="#0000ff" /> : null}
      <TestButton testID="readAssetFiles" onPress={handleReadAssetFiles} />
      <TestButton testID="clearAssetFiles" onPress={handleClearAssetFiles} />
      <TestButton testID="readLogEntries" onPress={handleReadLogEntries} />
      <TestButton testID="checkForUpdate" onPress={checkForUpdate} />
      {isUpdateAvailable ? (
        <TestButton testID="downloadUpdate" onPress={handleDownloadUpdate} />
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 100,
    marginBottom: 100,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: '#4630EB',
  },
  buttonText: {
    color: 'white',
  },
  logEntriesContainer: {
    margin: 10,
    height: 50,
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: '90%',
    minWidth: '90%',
    borderColor: '#4630EB',
    borderWidth: 1,
    borderRadius: 4,
  },
  logEntriesText: {
    fontSize: 8,
  },
});
