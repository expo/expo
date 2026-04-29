import AppMetrics, { type Metric } from 'expo-app-metrics';
import ExpoObserve from 'expo-observe';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Divider } from '@/components/Divider';
import { JSONView } from '@/components/JSONView';
import { useRouterMetricsHelpers } from '@/router-metrics-integration';
import { useTheme } from '@/utils/theme';

export default function Index() {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [showEntries, setShowEntries] = useState(false);

  const { markPageInteractive } = useRouterMetricsHelpers();

  const updateStoredEntries = useCallback(async () => {
    const events = await AppMetrics.getStoredEntries();
    setMetrics(events);
  }, []);

  useEffect(() => {
    updateStoredEntries();
  }, [updateStoredEntries]);

  async function handleMarkInteractive() {
    await AppMetrics.markInteractive();
    await markPageInteractive();
    await updateStoredEntries();
  }

  async function handleDispatchEvents() {
    await ExpoObserve.dispatchEvents();
    await updateStoredEntries();
  }

  async function handleClearStoredEntries() {
    await AppMetrics.clearStoredEntries();
    await updateStoredEntries();
  }

  async function handleGetStoredEntries() {
    await updateStoredEntries();
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.contentContainer}>
      <Button title="Mark as interactive" onPress={handleMarkInteractive} theme="secondary" />
      <Button title="Dispatch events" onPress={handleDispatchEvents} theme="secondary" />
      <Button title="Clear stored entries" onPress={handleClearStoredEntries} theme="secondary" />
      <Button title="Get stored entries" onPress={handleGetStoredEntries} theme="secondary" />

      <Divider />

      <View style={styles.header}>
        {metrics.length === 0 ? (
          <Text style={[styles.countText, { color: theme.text.default }]}>No stored entries</Text>
        ) : (
          <Button
            title={
              showEntries ? `Hide entries (${metrics.length})` : `View entries (${metrics.length})`
            }
            onPress={() => setShowEntries(!showEntries)}
          />
        )}
      </View>

      {showEntries && metrics.length ? <JSONView value={metrics} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  contentContainer: {
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
});
