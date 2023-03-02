import { Inter_900Black } from '@expo-google-fonts/inter';
import { NativeModulesProxy } from 'expo-modules-core';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { UpdatesLogEntry } from 'expo-updates';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

require('./test.png');
Inter_900Black;

export default function App() {
  const [numAssetFiles, setNumAssetFiles] = React.useState(0);
  const [logs, setLogs] = React.useState<UpdatesLogEntry[]>([]);
  const [active, setActive] = React.useState(false);

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

  const runTypeMessage = Updates.isEmbeddedLaunch
    ? 'This app is running from built-in code'
    : 'This app is running an update';

  return (
    <View style={styles.container}>
      <Text>Update string</Text>
      <Text testID="updateString">/notify/test</Text>
      <Text>---</Text>
      <Text>Update ID</Text>
      <Text testID="updateID">{Updates.updateId}</Text>
      <Text>---</Text>
      <Text testID="runTypeMessage">{runTypeMessage}</Text>
      <Text>---</Text>
      <Text>Number of asset files in DB</Text>
      <Text testID="numAssetFiles">{numAssetFiles}</Text>
      <Text>---</Text>
      <Text>Log messages</Text>
      <ScrollView style={styles.logEntriesContainer}>
        <Text testID="logEntries" style={styles.logEntriesText}>
          {logsToString(logs)}
        </Text>
      </ScrollView>

      {active ? <ActivityIndicator testID="activity" size="small" color="#0000ff" /> : null}
      <Pressable testID="readAssetFiles" style={styles.button} onPress={handleReadAssetFiles}>
        <Text style={styles.buttonText}>Read number of asset files</Text>
      </Pressable>
      <Pressable testID="clearAssetFiles" style={styles.button} onPress={handleClearAssetFiles}>
        <Text style={styles.buttonText}>Clear asset files</Text>
      </Pressable>
      <Pressable testID="readLogEntries" style={styles.button} onPress={handleReadLogEntries}>
        <Text style={styles.buttonText}>Read logs</Text>
      </Pressable>

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
  logEntriesContainer: {
    margin: 10,
    height: 200,
    paddingVertical: 12,
    paddingHorizontal: 32,
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
