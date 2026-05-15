import { useObserve } from 'expo-observe';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

export default function ParamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { markInteractive } = useObserve();

  useEffect(() => {
    markInteractive({ params: { id } });
  }, [id]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `id: ${id}` }} />
      <Text style={[styles.label, { color: theme.text.secondary }]}>Current param</Text>
      <Text style={[styles.value, { color: theme.text.default }]}>{id}</Text>
      <Button
        title="Open id: foo"
        onPress={() => router.push('/examples/nested-stack/foo')}
        disabled={id === 'foo'}
      />
      <Button
        title="Open id: bar"
        onPress={() => router.push('/examples/nested-stack/bar')}
        disabled={id === 'bar'}
      />
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
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
});
