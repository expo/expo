import AppMetrics from 'expo-app-metrics';
import ExpoObserve, { useObserve } from 'expo-observe';
import { checkForUpdateAsync, fetchUpdateAsync, reloadAsync, useUpdates } from 'expo-updates';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Divider } from '@/components/Divider';
import { useTheme } from '@/utils/theme';

export default function Index() {
  const theme = useTheme();
  const { isUpdateAvailable, isUpdatePending, availableUpdate, currentlyRunning } = useUpdates();

  const { markInteractive } = useObserve();

  async function handleMarkInteractive() {
    await markInteractive();
  }

  async function handleDispatchEvents() {
    await ExpoObserve.dispatchEvents();
  }

  async function handleClearStoredEntries() {
    await AppMetrics.clearStoredEntries();
  }

  async function handleCheckForUpdate() {
    await checkForUpdateAsync();
  }

  async function downloadUpdate() {
    await fetchUpdateAsync();
  }

  async function reload() {
    setTimeout(() => reloadAsync(), 2000);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.contentContainer}>
      <Button title="Mark as interactive" onPress={handleMarkInteractive} theme="secondary" />
      <Button title="Dispatch events" onPress={handleDispatchEvents} theme="secondary" />
      <Button title="Clear stored entries" onPress={handleClearStoredEntries} theme="secondary" />
      <Button title="Check for update" onPress={() => handleCheckForUpdate()} theme="secondary" />
      {isUpdateAvailable && !isUpdatePending ? (
        <Button
          title={`Download update ${availableUpdate?.updateId}`}
          onPress={() => downloadUpdate()}
          theme="secondary"
        />
      ) : null}
      {isUpdatePending ? (
        <Button
          title={`Launch update ${availableUpdate?.updateId}`}
          onPress={() => reload()}
          theme="secondary"
        />
      ) : null}
      <Text style={{ color: theme.text.default }}>
        {`Currently running ${currentlyRunning.updateId}`}
      </Text>
      <Text style={{ color: theme.text.default }}>
        {`${currentlyRunning.isEmbeddedLaunch ? 'Embedded bundle' : 'OTA bundle'}`}
      </Text>

      <Divider />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  contentContainer: {
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
});
