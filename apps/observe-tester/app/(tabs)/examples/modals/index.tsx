import { useObserve } from 'expo-observe';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

export default function ModalsIndex() {
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
        Each presentation pushes onto this stack and slides in differently on iOS.
      </Text>
      <Button title="Open modal" onPress={() => router.push('/examples/modals/modal')} />
      <Button
        title="Open form sheet"
        onPress={() => router.push('/examples/modals/formsheet')}
      />
      <Button
        title="Open page sheet"
        onPress={() => router.push('/examples/modals/pagesheet')}
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
  hint: {
    fontSize: 13,
    marginBottom: 16,
  },
});
