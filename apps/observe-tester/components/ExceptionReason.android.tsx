import type { CrashReport } from 'expo-app-metrics';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

// On Android the exception reason is a plain string: the throwable's composed
// message plus its `Caused by:` chain.
export function ExceptionReason({
  reason,
}: {
  reason: NonNullable<CrashReport['exceptionReason']>;
}) {
  const theme = useTheme();
  return <Text style={[styles.message, { color: theme.text.default }]}>{reason as string}</Text>;
}

const styles = StyleSheet.create({
  message: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
