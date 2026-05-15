import { useObserve } from 'expo-observe';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

const SCREENS = [
  { label: 'A', href: '/examples/preloaded/screen-a' },
  { label: 'B', href: '/examples/preloaded/screen-b' },
  { label: 'C', href: '/examples/preloaded/screen-c' },
] as const;

export default function PreloadedIndex() {
  const theme = useTheme();
  const { markInteractive } = useObserve();

  useEffect(() => {
    markInteractive();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.hint, { color: theme.text.secondary }]}>
        Tap Preload to warm up a screen, then Open to push it. Opening without preloading mounts
        cold — compare the TTI metrics in the Metrics tab.
      </Text>
      {SCREENS.map(({ label, href }) => (
        <View key={href} style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.text.default }]}>Screen {label}</Text>
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button
                title="Preload"
                theme="secondary"
                onPress={() => router.prefetch(href)}
              />
            </View>
            <View style={styles.action}>
              <Button title="Open" onPress={() => router.push(href)} />
            </View>
          </View>
        </View>
      ))}
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
  hint: {
    fontSize: 13,
    marginBottom: 20,
  },
  row: {
    marginBottom: 16,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  action: {
    flex: 1,
  },
});
