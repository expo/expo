import React from 'react';
import { View, Text, Pressable } from 'react-native';

import * as UseUpdates from '..';

const { useUpdates, checkForUpdate, downloadUpdate, readLogEntries } = UseUpdates;

const UseUpdatesTestApp = () => {
  const {
    currentlyRunning,
    availableUpdate,
    isUpdateAvailable,
    isUpdatePending,
    error,
    lastCheckForUpdateTimeSinceRestart,
    logEntries,
  } = useUpdates();
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
      {/* Booleans */}
      <Text testID="isUpdateAvailable">{`${isUpdateAvailable}`}</Text>
      <Text testID="isUpdatePending">{`${isUpdatePending}`}</Text>
      {/* Log entries, if they have been read */}
      {(logEntries?.length || 0) > 0 ? (
        <Text testID="logEntry">
          {JSON.stringify(logEntries ? logEntries[0].message : '') || ''}
        </Text>
      ) : null}
      {/* Error, if one has occurred */}
      {error ? <Text testID="error">{error.message}</Text> : null}
      {/* Buttons for test code to invoke methods */}
      <Pressable testID="checkForUpdate" onPress={() => checkForUpdate()} />
      <Pressable testID="downloadUpdate" onPress={() => downloadUpdate()} />
      <Pressable testID="readLogEntries" onPress={() => readLogEntries()} />
    </View>
  );
};

export default UseUpdatesTestApp;
