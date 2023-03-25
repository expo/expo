import React from 'react';
import { View, Text, Pressable } from 'react-native';

import * as Updates from '..';

const { useUpdates } = Updates.Provider;

export const UpdatesProviderTestApp = (props: {
  providerEventHandler?: (event: Updates.UpdatesProviderEvent) => void;
}) => {
  const { updatesInfo, checkForUpdate, downloadUpdate, downloadAndRunUpdate, readLogEntries } =
    useUpdates(props.providerEventHandler);
  return (
    <View>
      {/* Currently running info */}
      <Text testID="currentlyRunning_updateId">{updatesInfo.currentlyRunning.updateId}</Text>
      <Text testID="currentlyRunning_channel">{updatesInfo.currentlyRunning.channel}</Text>
      <Text testID="currentlyRunning_createdAt">
        {updatesInfo.currentlyRunning?.createdAt
          ? updatesInfo.currentlyRunning?.createdAt.toISOString()
          : ''}
      </Text>
      {/* Last time there was a check for update */}
      <Text testID="lastCheckForUpdateTime">
        {updatesInfo?.lastCheckForUpdateTime?.toISOString().substring(0, 19) || ''}
      </Text>
      {/* Available update, if one is present */}
      <Text testID="availableUpdate_updateId">{updatesInfo.availableUpdate?.updateId || ''}</Text>
      {/* Log entries, if they have been read */}
      {(updatesInfo.logEntries?.length || 0) > 0 ? (
        <Text testID="logEntry">
          {JSON.stringify(updatesInfo?.logEntries ? updatesInfo?.logEntries[0].message : '') || ''}
        </Text>
      ) : null}
      {/* Error, if one has occurred */}
      {updatesInfo?.error ? <Text testID="error">{JSON.stringify(updatesInfo?.error)}</Text> : null}
      {/* Buttons for test code to invoke methods */}
      <Pressable testID="checkForUpdate" onPress={() => checkForUpdate()} />
      <Pressable testID="downloadUpdate" onPress={() => downloadUpdate()} />
      <Pressable testID="downloadAndRunUpdate" onPress={() => downloadAndRunUpdate()} />
      <Pressable testID="readLogEntries" onPress={() => readLogEntries()} />
    </View>
  );
};
