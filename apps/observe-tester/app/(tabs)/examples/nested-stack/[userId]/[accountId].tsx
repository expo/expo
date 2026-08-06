import { ObserveInteractiveMarker } from 'expo-observe';
import { useLocalSearchParams } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

export default function FilteredParamsScreen() {
  const { userId, accountId, firstName, tab } = useLocalSearchParams<{
    userId: string;
    accountId: string;
    firstName?: string;
    tab?: string;
  }>();
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <ObserveInteractiveMarker />
      <Text style={[styles.label, { color: theme.text.secondary }]}>Route params</Text>
      <Text style={[styles.value, { color: theme.text.default }]}>userId: {userId}</Text>
      <Text style={[styles.value, { color: theme.text.default }]}>accountId: {accountId}</Text>
      <Text style={[styles.label, { color: theme.text.secondary }]}>Query params</Text>
      <Text style={[styles.value, { color: theme.text.default }]}>firstName: {firstName}</Text>
      <Text style={[styles.value, { color: theme.text.default }]}>tab: {tab}</Text>
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
});
