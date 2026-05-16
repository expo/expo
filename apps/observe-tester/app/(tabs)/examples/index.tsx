import { useObserve } from 'expo-observe';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

export default function ExamplesIndex() {
  const theme = useTheme();
  const { markInteractive } = useObserve();

  useEffect(() => {
    markInteractive();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Button
        title="Nested stack"
        description="Network, heavy renders, params, nested modal"
        onPress={() => router.push('/examples/nested-stack')}
      />
      <Button
        title="Preloaded"
        description="Prefetch screens before navigating"
        onPress={() => router.push('/examples/preloaded')}
      />
      <Button
        title="Modals"
        description="modal / formSheet / pageSheet presentations"
        onPress={() => router.push('/examples/modals')}
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
});
