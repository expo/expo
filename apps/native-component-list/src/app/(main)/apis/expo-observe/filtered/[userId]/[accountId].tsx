import { useTheme } from 'ThemeProvider';
import { useObserve } from 'expo-observe';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function FilteredParamsScreen() {
  const { theme } = useTheme();
  const { markInteractive } = useObserve();
  const { userId, accountId, firstName, tab, p1, p2 } = useLocalSearchParams<{
    userId?: string;
    accountId?: string;
    firstName?: string;
    tab?: string;
    p1?: string;
    p2?: string;
  }>();

  useEffect(() => {
    markInteractive();
  }, [markInteractive]);

  return (
    <>
      <Stack.Screen options={{ title: 'Filtered Params' }} />
      <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
        <Text style={[styles.label, { color: theme.text.secondary }]}>Path params</Text>
        <Text style={[styles.value, { color: theme.text.default }]}>userId: {userId}</Text>
        <Text style={[styles.value, { color: theme.text.default }]}>accountId: {accountId}</Text>
        <Text style={[styles.label, { color: theme.text.secondary }]}>Query params</Text>
        <Text style={[styles.value, { color: theme.text.default }]}>firstName: {firstName}</Text>
        <Text style={[styles.value, { color: theme.text.default }]}>tab: {tab}</Text>
        <Text style={[styles.value, { color: theme.text.default }]}>p1: {p1}</Text>
        <Text style={[styles.value, { color: theme.text.default }]}>p2: {p2}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
});
