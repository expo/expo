import { useObserve } from 'expo-observe';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/utils/theme';

const BLOCK_MS = 500;
const TILE_COUNT = 2000;

function blockMainThread(durationMs: number) {
  const end = Date.now() + durationMs;
  let acc = 0;
  while (Date.now() < end) {
    acc += Math.sqrt(Math.random() * 1_000_000);
  }
  return acc;
}

export default function HeavyScreen() {
  const theme = useTheme();
  const { markInteractive } = useObserve();

  blockMainThread(BLOCK_MS);

  useEffect(() => {
    markInteractive({ params: { kind: 'heavy' } });
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: theme.text.default }]}>
        Rendered {TILE_COUNT} tiles after blocking the main thread for {BLOCK_MS}ms.
      </Text>
      <View style={styles.grid}>
        {Array.from({ length: TILE_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.tile,
              { backgroundColor: theme.background.element, borderColor: theme.border.default },
            ]}
          />
        ))}
      </View>
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  tile: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderRadius: 2,
  },
});
