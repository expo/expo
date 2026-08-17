import AppMetrics from 'expo-app-metrics';
import { Observe } from 'expo-observe';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

export default function EventFlood() {
  const theme = useTheme();
  const [lastRun, setLastRun] = useState<{ count: number; elapsedMs: number } | null>(null);

  function logFlood(count: number) {
    const startedAt = performance.now();

    for (let index = 0; index < count; index++) {
      Observe.logEvent('stress.driver_event', {
        severity: 'info',
        body: 'Driver telemetry update received',
        attributes: {
          driverId: 'driver_48291',
          vehicleId: 'vehicle_731',
          tripId: 'trip_2026_08_14_1842',
          mode: 'delivery',
          isOnline: true,
          speedKph: 42.7,
          location: {
            latitude: 37.7751,
            longitude: -122.4193,
            accuracyMeters: 8.4,
          },
          route: ['warehouse', 'pickup', 'dropoff'],
          index,
        },
      });
    }

    setLastRun({ count, elapsedMs: Math.round(performance.now() - startedAt) });
  }

  async function clearStoredEntries() {
    await AppMetrics.clearStoredEntries();
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.description, { color: theme.text.secondary }]}>
        Log a burst of driver telemetry events synchronously to reproduce high-volume integrations.
      </Text>
      <Button title="Log 100 events" onPress={() => logFlood(100)} />
      <Button title="Log 1,000 events" onPress={() => logFlood(1_000)} />
      <Button title="Log 5,000 events" onPress={() => logFlood(5_000)} />
      <Button title="Clear stored entries" onPress={clearStoredEntries} theme="secondary" />
      {lastRun ? (
        <Text style={[styles.status, { color: theme.text.default }]}>
          Logged {lastRun.count.toLocaleString()} events in {lastRun.elapsedMs.toLocaleString()} ms
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
});
