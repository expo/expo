import { useObserve } from 'expo-observe';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/utils/theme';

const SIMULATED_LATENCY_MS = 1500;

export default function NetworkScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<string | null>(null);
  const { markInteractive } = useObserve();

  useEffect(() => {
    const timer = setTimeout(() => {
      setPayload('Fetched after a 1.5s round trip.');
      setLoading(false);
      markInteractive({ params: { kind: 'network' } });
    }, SIMULATED_LATENCY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View
        style={[styles.container, styles.center, { backgroundColor: theme.background.screen }]}>
        <ActivityIndicator color={theme.text.secondary} />
        <Text style={[styles.hint, { color: theme.text.secondary }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: theme.text.default }]}>Response</Text>
      <Text style={[styles.body, { color: theme.text.default }]}>{payload}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
  },
});
