import { Inter_900Black } from '@expo-google-fonts/inter';
import Constants from 'expo-constants';
import { requireNativeModule } from 'expo-modules-core';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { UpdatesLogEntry } from 'expo-updates';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const ExpoUpdatesE2ETest = requireNativeModule('ExpoUpdatesE2ETest');

require('./includedAssets/test.png');
require('./includedAssets/lock-filled.svg');
// eslint-disable-next-line no-unused-expressions
Inter_900Black;

// keep the line below for replacement in generate-test-update-bundles
// REPLACE_WITH_CRASHING_CODE

function TestValue(props: { testID: string; value: string }) {
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.labelText}>{props.testID}</Text>
        <Text style={styles.labelText}>&nbsp;</Text>
        <Text style={styles.labelText} testID={props.testID}>
          {props.value || 'null'}
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
  const [numActive, setNumActive] = React.useState(0);
  const [extraParamsString, setExtraParamsString] = React.useState('');
  const [isRollback, setIsRollback] = React.useState(false);
  const [isReloading, setIsReloading] = React.useState(false);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [didCheckAndDownloadHappenInParallel, setDidCheckAndDownloadHappenInParallel] =
    React.useState(false);

  const {
    currentlyRunning,
    availableUpdate,
    downloadedUpdate,
    isUpdateAvailable,
    isUpdatePending,
    checkError,
    isChecking,
    isDownloading,
  } = Updates.useUpdates();

  React.useEffect(() => {
    setStartTime(Date.now());
  }, []);

  // Get rollback state with this, until useUpdates() supports rollbacks
  React.useEffect(() => {
    const handleAsync = async () => {
      setIsRollback(availableUpdate?.type === Updates.UpdateInfoType.ROLLBACK);
    };
    if (isUpdateAvailable) {
      handleAsync();
    }
  }, [isUpdateAvailable]);

  // Record if checking an downloading happen in parallel (they shouldn't)
  React.useEffect(() => {
    if (isChecking && isDownloading) {
      setDidCheckAndDownloadHappenInParallel(true);
    }
  }, [isChecking, isDownloading]);

  const runBlockAsync = (block: () => Promise<void>) => async () => {
    setNumActive((n) => n + 1);
    try {
      await block();
    } catch (e) {
      console.warn(e);
    } finally {
      setNumActive((n) => n - 1);
    }
  };

  const handleSetExtraParams = runBlockAsync(async () => {
    await Updates.setExtraParamAsync('testsetnull', 'testvalue');
    await Updates.setExtraParamAsync('testsetnull', null);
    await Updates.setExtraParamAsync('testparam', 'testvalue');
    const params = await Updates.getExtraParamsAsync();
    setExtraParamsString(JSON.stringify(params, null, 2));
  });

  const handleReadAssetFiles = runBlockAsync(async () => {
    const numFiles = await ExpoUpdatesE2ETest.readInternalAssetsFolderAsync();
    setNumAssetFiles(numFiles);
  });

  const handleClearAssetFiles = runBlockAsync(async () => {
    await ExpoUpdatesE2ETest.clearInternalAssetsFolderAsync();
    const numFiles = await ExpoUpdatesE2ETest.readInternalAssetsFolderAsync();
    setNumAssetFiles(numFiles);
  });

  const handleReadLogEntries = runBlockAsync(async () => {
    const logEntries = await Updates.readLogEntriesAsync(60000);
    setLogs(logEntries);
  });

  const handleClearLogEntries = runBlockAsync(async () => {
    await Updates.clearLogEntriesAsync();
  });

  const handleReload = async () => {
    setIsReloading(true);
    // this is done after a timeout so that the button press finishes for detox
    setTimeout(async () => {
      try {
        await Updates.reloadAsync();
        setIsReloading(false);
      } catch (e) {
        console.warn(e);
      }
    }, 2000);
  };

  const handleCheckForUpdate = runBlockAsync(async () => {
    await Updates.checkForUpdateAsync();
  });

  const handleDownloadUpdate = runBlockAsync(async () => {
    await Updates.fetchUpdateAsync();
  });

  const handleCheckAndDownloadAtSameTime = runBlockAsync(async () => {
    await Promise.all([
      Updates.checkForUpdateAsync(),
      Updates.fetchUpdateAsync(),
      Updates.checkForUpdateAsync(),
      Updates.fetchUpdateAsync(),
      Updates.checkForUpdateAsync(),
      Updates.fetchUpdateAsync(),
      Updates.checkForUpdateAsync(),
    ]);
  });

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
      <TestValue testID="numActive" value={`${numActive}`} />
      <TestValue
        testID="didCheckAndDownloadHappenInParallel"
        value={`${didCheckAndDownloadHappenInParallel}`}
      />
      <TestValue testID="updateString" value="test" />
      <TestValue testID="updateID" value={`${Updates.updateId}`} />
      <TestValue testID="numAssetFiles" value={`${numAssetFiles}`} />
      <TestValue testID="runtimeVersion" value={`${currentlyRunning.runtimeVersion}`} />
      <TestValue testID="checkAutomatically" value={`${Updates.checkAutomatically}`} />
      <TestValue testID="isEmbeddedLaunch" value={`${currentlyRunning.isEmbeddedLaunch}`} />
      <TestValue testID="launchDuration" value={`${currentlyRunning.launchDuration}`} />
      <TestValue testID="availableUpdateID" value={`${availableUpdate?.updateId}`} />
      <TestValue testID="extraParamsString" value={`${extraParamsString}`} />
      <TestValue testID="isReloading" value={`${isReloading}`} />
      <TestValue testID="startTime" value={`${startTime}`} />

      <TestValue testID="state.isUpdateAvailable" value={`${isUpdateAvailable}`} />
      <TestValue testID="state.isUpdatePending" value={`${isUpdatePending}`} />
      <TestValue testID="state.isRollback" value={`${isRollback}`} />
      <TestValue testID="state.checkError" value={`${checkError?.message ?? ''}`} />
      <TestValue
        testID="state.rollbackCommitTime"
        value={`${isRollback ? availableUpdate?.createdAt.toISOString() : ''}`}
      />
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

      {numActive > 0 ? <ActivityIndicator testID="activity" size="small" color="#0000ff" /> : null}
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
          <TestButton
            testID="triggerParallelFetchAndDownload"
            onPress={handleCheckAndDownloadAtSameTime}
          />
          <TestButton testID="reload" onPress={handleReload} />
        </View>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

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
