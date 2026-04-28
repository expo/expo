import { Code } from '@expo/html-elements';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { useRouterMetricsHelpers } from '@/router-metrics-integration';
import { Button } from '../../../components/Button';
import AppMetrics, { type Metric } from 'expo-app-metrics';
import ExpoObserve from 'expo-observe';

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}
      contentContainerStyle={styles.contentContainer}>
      <Button title="Mark as interactive" onPress={handleMarkInteractive} theme="secondary" />
      <Button title="Dispatch events" onPress={handleDispatchEvents} theme="secondary" />
      <Button title="Clear stored entries" onPress={handleClearStoredEntries} theme="secondary" />
      <Button title="Get stored entries" onPress={handleGetStoredEntries} theme="secondary" />

      <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#E5E5E5' }]} />

      <View style={styles.header}>
        {metrics.length === 0 ? (
          <Text style={[styles.countText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            No stored entries
          </Text>
        ) : (
          <Button
            title={
              showEntries ? `Hide entries (${metrics.length})` : `View entries (${metrics.length})`
            }
            onPress={() => setShowEntries(!showEntries)}
          />
        )}
      </View>

      {showEntries && metrics.length ? <JSONView value={metrics} isDark={isDark} /> : null}
    </ScrollView>
  );
}

function JSONView({ value, isDark }: { value: any; isDark: boolean }) {
  return (
    <Code style={[styles.code, { color: isDark ? '#E5E5E5' : '#000000' }]}>
      {JSON.stringify(value, deterministicJSONReplacer, 2)}
    </Code>
  );
}

// A replacer function for JSON.stringify that guarantees the same keys order
function deterministicJSONReplacer(_: any, value: any) {
  return typeof value !== 'object' || value === null || Array.isArray(value)
    ? value
    : Object.fromEntries(
        Object.entries(value).sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0))
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
  code: {
    fontSize: 12,
  },
  contentContainer: {
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
});
