import * as Updates from 'expo-updates';
import * as React from 'react';
import { ScrollView, Button } from 'react-native';

import MonoText from '../components/MonoText';

export default function UpdatesScreen() {
  async function checkForUpdateAsync() {
    try {
      const result = await Updates.checkForUpdateAsync();
      alert(JSON.stringify(result));
    } catch (error) {
      alert(error);
    }
  }

  async function fetchUpdateAsync() {
    try {
      const result = await Updates.fetchUpdateAsync();
      alert(JSON.stringify(result));
    } catch (error) {
      alert(error);
    }
  }

  async function reloadAsync() {
    try {
      const result = await Updates.reloadAsync();
      alert(JSON.stringify(result));
    } catch (error) {
      alert(error);
    }
  }

  async function clearUpdateCacheExperimentalAsync() {
    try {
      const result = await Updates.clearUpdateCacheExperimentalAsync();
      alert(JSON.stringify(result));
    } catch (error) {
      alert(error);
    }
  }

  return (
    <ScrollView style={{ padding: 10 }}>
      <Button title="checkForUpdateAsync" onPress={checkForUpdateAsync} />
      <Button title="fetchUpdateAsync" onPress={fetchUpdateAsync} />
      <Button title="reloadAsync" onPress={reloadAsync} />
      <Button
        title="clearUpdateCacheExperimentalAsync"
        onPress={clearUpdateCacheExperimentalAsync}
      />
      <MonoText textStyle={{ fontSize: 16 }}>
        {JSON.stringify(
          {
            isEmergencyLaunch: Updates.isEmergencyLaunch,
            isUsingEmbeddedAssets: Updates.isUsingEmbeddedAssets,
            localAssets: Updates.localAssets,
            manifest: Updates.manifest,
            releaseChannel: Updates.releaseChannel,
            updateId: Updates.updateId,
          },
          null,
          2
        )}
      </MonoText>
    </ScrollView>
  );
}
