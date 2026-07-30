import { ObserveInteractiveMarker } from 'expo-observe';
import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

export default function PageSheetScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <ObserveInteractiveMarker />
      <Text style={[styles.heading, { color: theme.text.default }]}>Page sheet</Text>
      <Text style={[styles.body, { color: theme.text.secondary }]}>
        {`presentation: 'pageSheet'`}
      </Text>
      <Button title="Open modal" onPress={() => router.push('/examples/modals/modal')} />
      <Button
        title="Open form sheet"
        onPress={() => router.push('/examples/modals/formsheet')}
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
