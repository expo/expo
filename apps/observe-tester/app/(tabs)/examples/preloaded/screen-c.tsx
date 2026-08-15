import { useObserve } from 'expo-observe';
import { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

const READY_DELAY_MS = 300;

export default function ScreenC() {
  const theme = useTheme();
  const { markInteractive } = useObserve();

  useEffect(() => {
    const timer = setTimeout(() => markInteractive({ params: { screen: 'c' } }), READY_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: theme.text.default }]}>Screen C</Text>
      <Text style={[styles.body, { color: theme.text.secondary }]}>
        Marks interactive after a {READY_DELAY_MS}ms warmup.
      </Text>
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
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
  },
});
