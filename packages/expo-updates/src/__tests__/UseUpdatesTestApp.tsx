import React from 'react';
import { View, Text, Pressable } from 'react-native';

import * as Updates from '../';

const { checkForUpdateAsync, fetchUpdateAsync, useUpdates } = Updates;

const UseUpdatesTestApp = () => {
  const {
    currentlyRunning,
    availableUpdate,
    downloadedUpdate,
    isUpdateAvailable,
    isUpdatePending,
    checkError,
    downloadError,
    initializationError,
    lastCheckForUpdateTimeSinceRestart,
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
      {/* Downloaded update, if one is present */}
      <Text testID="downloadedUpdate_updateId">{downloadedUpdate?.updateId || ''}</Text>
      {/* Booleans */}
      <Text testID="isUpdateAvailable">{`${isUpdateAvailable}`}</Text>
      <Text testID="isUpdatePending">{`${isUpdatePending}`}</Text>
      {/* Errors, if they occur */}
      {checkError ? <Text testID="checkError">{checkError.message}</Text> : null}
      {downloadError ? <Text testID="downloadError">{downloadError.message}</Text> : null}
      {initializationError ? (
        <Text testID="initializationError">{initializationError.message}</Text>
      ) : null}
      {/* Buttons for test code to invoke methods */}
      <Pressable testID="checkForUpdate" onPress={() => checkForUpdateAsync()} />
      <Pressable testID="downloadUpdate" onPress={() => fetchUpdateAsync()} />
    </View>
  );
};

export default UseUpdatesTestApp;
