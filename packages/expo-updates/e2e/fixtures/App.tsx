import { Inter_900Black } from '@expo-google-fonts/inter';
import Constants from 'expo-constants';
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
      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.labelText}>{props.testID}</Text>
        <Text style={styles.labelText}>&nbsp;</Text>
        <Text style={styles.labelText} testID={props.testID}>
          {props.value}
        </Text>
      </View>
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
  const [lastUpdateEventType, setLastUpdateEventType] = React.useState('');
  const [extraParamsString, setExtraParamsString] = React.useState('');
  const [nativeStateContextString, setNativeStateContextString] = React.useState('{}');
  const [isRollback, setIsRollback] = React.useState(false);

  const {
    currentlyRunning,
    availableUpdate,
    downloadedUpdate,
    isUpdateAvailable,
    isUpdatePending,
    checkError,
  } = Updates.useUpdates();

  Updates.useUpdateEvents((event) => {
    setLastUpdateEventType(event.type);
  });

  // Get rollback state with this, until useUpdates() supports rollbacks
  React.useEffect(() => {
    const handleAsync = async () => {
      const state = await Updates.getNativeStateMachineContextAsync();
      setIsRollback(state.isRollback);
    };
    if (isUpdateAvailable) {
      handleAsync();
    }
  }, [isUpdateAvailable]);

  const handleReadNativeStateContext = () => {
    const handleAsync = async () => {
      setActive(true);
      const state = await Updates.getNativeStateMachineContextAsync();
      setNativeStateContextString(JSON.stringify(state));
      await delay(1000);
      setActive(false);
    };
    handleAsync().catch((e) => {
      console.warn(e);
    });
  };

  const handleSetExtraParams = () => {
    const handleAsync = async () => {
      setActive(true);
      await Updates.setExtraParamAsync('testsetnull', 'testvalue');
      await Updates.setExtraParamAsync('testsetnull', null);
      await Updates.setExtraParamAsync('testparam', 'testvalue');
      const params = await Updates.getExtraParamsAsync();
      setExtraParamsString(JSON.stringify(params, null, 2));
      await delay(1000);
      setActive(false);
    };
    handleAsync().catch((e) => {
      console.warn(e);
    });
  };

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

  const handleClearLogEntries = () => {
    const handleAsync = async () => {
      setActive(true);
      await Updates.clearLogEntriesAsync();
      await delay(1000);
      setActive(false);
    };
    handleAsync().catch((e) => {
      console.warn(e);
    });
  };

  const handleCheckForUpdate = () => {
    Updates.checkForUpdateAsync();
  };

  const handleDownloadUpdate = () => {
    Updates.fetchUpdateAsync();
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
      <TestValue testID="checkAutomatically" value={`${Updates.checkAutomatically}`} />
      <TestValue testID="isEmbeddedLaunch" value={`${currentlyRunning.isEmbeddedLaunch}`} />
      <TestValue testID="availableUpdateID" value={`${availableUpdate?.updateId}`} />
      <TestValue testID="extraParamsString" value={`${extraParamsString}`} />

      <TestValue testID="state.isUpdateAvailable" value={`${isUpdateAvailable}`} />
      <TestValue testID="state.isUpdatePending" value={`${isUpdatePending}`} />
      <TestValue testID="state.isRollback" value={`${isRollback}`} />
      <TestValue testID="state.checkError" value={`${checkError?.message ?? ''}`} />
      {/*
      <TestValue testID="state.isRollback" value={`${availableUpdate?.isRollback ?? false}`} />
        */}
      <TestValue
        testID="state.latestManifest.id"
        value={`${availableUpdate?.manifest?.id || ''}`}
      />
      <TestValue
        testID="state.downloadedManifest.id"
        value={`${downloadedUpdate?.manifest?.id || ''}`}
      />

      <Text>Log messages</Text>
      <ScrollView contentContainerStyle={styles.logEntriesContainer}>
        <Text testID="logEntries" style={styles.logEntriesText}>
          {logsToString(logs)}
        </Text>
      </ScrollView>

      <Text>Updates expoConfig</Text>
      <ScrollView contentContainerStyle={styles.logEntriesContainer}>
        <Text testID="updates.expoClient" style={styles.logEntriesText}>
          {JSON.stringify(Updates.manifest?.extra?.expoClient || {})}
        </Text>
      </ScrollView>

      <Text>Constants expoConfig</Text>
      <ScrollView contentContainerStyle={styles.logEntriesContainer}>
        <Text testID="constants.expoConfig" style={styles.logEntriesText}>
          {JSON.stringify(Constants.expoConfig)}
        </Text>
      </ScrollView>

      <Text>Native state context</Text>
      <ScrollView contentContainerStyle={styles.logEntriesContainer}>
        <Text testID="nativeStateContextString" style={styles.logEntriesText}>
          {nativeStateContextString}
        </Text>
      </ScrollView>

      {active ? <ActivityIndicator testID="activity" size="small" color="#0000ff" /> : null}
      <View style={{ flexDirection: 'row' }}>
        <View>
          <TestButton testID="readAssetFiles" onPress={handleReadAssetFiles} />
          <TestButton testID="clearAssetFiles" onPress={handleClearAssetFiles} />
          <TestButton testID="readLogEntries" onPress={handleReadLogEntries} />
          <TestButton testID="clearLogEntries" onPress={handleClearLogEntries} />
        </View>
        <View>
          <TestButton testID="checkForUpdate" onPress={handleCheckForUpdate} />
          <TestButton testID="downloadUpdate" onPress={handleDownloadUpdate} />
          <TestButton testID="setExtraParams" onPress={handleSetExtraParams} />
          <TestButton testID="readNativeStateContext" onPress={handleReadNativeStateContext} />
        </View>
      </View>

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
    margin: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: '#4630EB',
  },
  buttonText: {
    color: 'white',
    fontSize: 6,
  },
  labelText: {
    fontSize: 6,
  },
  logEntriesContainer: {
    margin: 10,
    height: 50,
    paddingVertical: 5,
    paddingHorizontal: 10,
    width: '90%',
    minWidth: '90%',
    borderColor: '#4630EB',
    borderWidth: 1,
    borderRadius: 4,
  },
  logEntriesText: {
    fontSize: 6,
  },
});
