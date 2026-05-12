import { useObserve } from 'expo-observe';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

export default function FormSheetScreen() {
  const theme = useTheme();
  const { markInteractive } = useObserve();

  useEffect(() => {
    markInteractive();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: theme.text.default }]}>Form sheet</Text>
      <Text style={[styles.body, { color: theme.text.secondary }]}>
        {`presentation: 'formSheet'`} with detents [0.5, 1] and a visible grabber.
      </Text>
      <Button title="Open modal" onPress={() => router.push('/examples/modals/modal')} />
      <Button
        title="Open page sheet"
        onPress={() => router.push('/examples/modals/pagesheet')}
      />
      <Button
        title="Back to index"
        theme="secondary"
        onPress={() => router.push('/examples/modals')}
      />
      <Button title="Close" theme="tertiary" onPress={() => router.back()} />
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
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    marginBottom: 24,
  },
});
