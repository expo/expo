import React from 'react';
import { View, Text, Pressable } from 'react-native';

import * as Updates from '..';
import { UseUpdatesCallbacksType } from '..';

const { useUpdates } = Updates;

const UseUpdatesTestApp = (props: { callbacks?: UseUpdatesCallbacksType }) => {
  const {
    currentlyRunning,
    availableUpdate,
    error,
    lastCheckForUpdateTimeSinceRestart,
    logEntries,
    checkForUpdate,
    downloadUpdate,
    downloadAndRunUpdate,
    readLogEntries,
  } = useUpdates(props.callbacks);
  return (
    <View>
      {/* Currently running info */}
      <Text testID="currentlyRunning_updateId">{currentlyRunning.updateId}</Text>
      <Text testID="currentlyRunning_channel">{currentlyRunning.channel}</Text>
      <Text testID="currentlyRunning_createdAt">
        {currentlyRunning?.createdAt ? currentlyRunning?.createdAt.toISOString() : ''}
      </Text>
      {/* Last time there was a check for update */}
      <Text testID="lastCheckForUpdateTime">
        {lastCheckForUpdateTimeSinceRestart?.toISOString().substring(0, 19) || ''}
      </Text>
      {/* Available update, if one is present */}
      <Text testID="availableUpdate_updateId">{availableUpdate?.updateId || ''}</Text>
      {/* Log entries, if they have been read */}
      {(logEntries?.length || 0) > 0 ? (
        <Text testID="logEntry">
          {JSON.stringify(logEntries ? logEntries[0].message : '') || ''}
        </Text>
      ) : null}
      {/* Error, if one has occurred */}
      {error ? <Text testID="error">{JSON.stringify(error)}</Text> : null}
      {/* Buttons for test code to invoke methods */}
      <Pressable testID="checkForUpdate" onPress={() => checkForUpdate()} />
      <Pressable testID="downloadUpdate" onPress={() => downloadUpdate()} />
      <Pressable testID="downloadAndRunUpdate" onPress={() => downloadAndRunUpdate()} />
      <Pressable testID="readLogEntries" onPress={() => readLogEntries()} />
    </View>
  );
};

export default UseUpdatesTestApp;
